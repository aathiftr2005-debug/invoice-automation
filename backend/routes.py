import csv
import io
import json
import os
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import uuid4

import pdfplumber
import google.generativeai as genai
import requests
from flask import Blueprint, Response, current_app, jsonify, request
from sqlalchemy import desc, extract, func
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from models import Invoice, db
from pdf_gen import generate_invoice_pdf

api = Blueprint("api", __name__)

ALLOWED_EXTENSIONS = {"pdf"}

CHAT_INVOICE_SYSTEM_PROMPT = """
You are a strict invoice JSON extraction engine.
Return ONLY a valid JSON object. Do not include markdown, code fences, comments, or conversational text.
The JSON object must match this exact schema:
{
  "client_name": string,
  "description": string,
  "amount": float,
  "tax_rate": float
}
Rules:
- Infer reasonable values from the user's natural language invoice request.
- If client_name is missing, use "Unknown Client".
- If description is missing, use "Invoice services".
- If amount is missing or unclear, use 0.0.
- If tax_rate is missing or unclear, use 0.0.
- amount and tax_rate must be numbers, not strings.
""".strip()


def is_allowed_pdf(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file_storage) -> tuple[str, str]:
    original_filename = secure_filename(file_storage.filename or "")
    if not original_filename or not is_allowed_pdf(original_filename):
        raise ValueError("Only PDF invoices are supported.")

    upload_dir = Path(current_app.config["UPLOAD_FOLDER"])
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}_{original_filename}"
    file_path = upload_dir / stored_filename
    file_storage.save(file_path)
    return str(file_path), original_filename


def extract_pdf_text(file_path: str) -> str:
    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)
    extracted_text = "\n".join(text_parts).strip()
    if not extracted_text:
        raise ValueError("No readable text was found in the PDF.")
    return extracted_text


def build_claude_prompt(invoice_text: str) -> str:
    return f"""
Extract invoice data from the text below and return only valid JSON.
Required JSON shape:
{{
  "vendor_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "total_amount": number,
  "currency": "ISO currency code, default EUR",
  "line_items": [
    {{"description": "string", "quantity": number, "unit_price": number, "amount": number}}
  ]
}}

Rules:
- Do not include markdown fences or explanatory text.
- Use null for unknown values.
- Normalize dates to YYYY-MM-DD where possible.
- Currency should be a short code such as EUR, USD, GBP, INR.

Invoice text:
{invoice_text[:18000]}
""".strip()


def parse_claude_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or start >= end:
            raise ValueError("AI response did not contain valid JSON.") from None
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as error:
            raise ValueError("AI response JSON could not be parsed.") from error


def normalize_chat_invoice_payload(payload: dict) -> dict:
    return {
        "client_name": str(payload.get("client_name") or "Unknown Client"),
        "description": str(payload.get("description") or "Invoice services"),
        "amount": float(decimal_or_zero(payload.get("amount"))),
        "tax_rate": float(decimal_or_zero(payload.get("tax_rate"))),
    }


def extract_chat_invoice_details(user_text: str) -> dict:
    api_key = current_app.config.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=CHAT_INVOICE_SYSTEM_PROMPT,
    )
    response = model.generate_content(
        user_text,
        generation_config={"temperature": 0, "max_output_tokens": 512},
    )
    return normalize_chat_invoice_payload(parse_claude_json(response.text))


def extract_with_claude(invoice_text: str) -> dict:
    api_key = current_app.config.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": build_claude_prompt(invoice_text)}]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 1800},
    }
    response = requests.post(url, json=payload, timeout=current_app.config["REQUEST_TIMEOUT"])
    response.raise_for_status()
    raw_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    return normalize_invoice_payload(parse_claude_json(raw_text))

    
def parse_invoice_date(value):
    if not value:
        return None
    for date_format in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(value), date_format).date()
        except ValueError:
            continue
    return None


def decimal_or_zero(value) -> Decimal:
    try:
        return Decimal(str(value or "0")).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def normalize_line_items(items) -> list[dict]:
    normalized_items = []
    for item in items if isinstance(items, list) else []:
        normalized_items.append(
            {
                "description": str(item.get("description") or "Invoice item"),
                "quantity": float(item.get("quantity") or 0),
                "unit_price": float(decimal_or_zero(item.get("unit_price"))),
                "amount": float(decimal_or_zero(item.get("amount"))),
            }
        )
    return normalized_items


def normalize_invoice_payload(payload: dict) -> dict:
    return {
        "vendor_name": payload.get("vendor_name"),
        "invoice_number": payload.get("invoice_number"),
        "invoice_date": parse_invoice_date(payload.get("invoice_date")),
        "total_amount": decimal_or_zero(payload.get("total_amount")),
        "currency": (payload.get("currency") or "EUR")[:10].upper(),
        "line_items": normalize_line_items(payload.get("line_items", [])),
    }


def create_invoice_record(payload: dict, filename: str) -> Invoice:
    invoice = Invoice(
        vendor_name=payload["vendor_name"],
        invoice_number=payload["invoice_number"],
        invoice_date=payload["invoice_date"],
        total_amount=payload["total_amount"],
        currency=payload["currency"],
        line_items=payload["line_items"],
        file_name=filename,
    )
    db.session.add(invoice)
    db.session.commit()
    return invoice


@api.post("/upload")
def upload_invoice():
    if "file" not in request.files:
        return jsonify({"error": "A PDF file is required."}), 400

    file_storage = request.files["file"]
    file_path = None
    try:
        file_path, original_filename = save_uploaded_file(file_storage)
        invoice_text = extract_pdf_text(file_path)
        extracted_payload = extract_with_claude(invoice_text)
        invoice = create_invoice_record(extracted_payload, original_filename)
        return jsonify({"invoice": invoice.to_dict()}), 201
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except requests.HTTPError:
        return jsonify({"error": "AI extraction service returned an error."}), 502
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "An invoice with this invoice number already exists."}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Invoice processing failed. Please try again."}), 500
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


@api.post("/chat-invoice")
def chat_invoice():
    payload = request.get_json(silent=True) or {}
    user_text = str(payload.get("text") or payload.get("message") or payload.get("prompt") or "").strip()
    if not user_text:
        return jsonify({"error": "Text input is required."}), 400

    try:
        invoice_details = extract_chat_invoice_details(user_text)
        return jsonify(invoice_details), 200
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:
        return jsonify({"error": "AI invoice parsing failed. Please try again."}), 502


@api.get("/invoices")
def list_invoices():
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 10, type=int), 1), 100)
    search = request.args.get("search", "").strip()
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = Invoice.query
    if search:
        query = query.filter(Invoice.vendor_name.ilike(f"%{search}%"))
    parsed_start_date = parse_invoice_date(start_date)
    parsed_end_date = parse_invoice_date(end_date)
    if parsed_start_date:
        query = query.filter(Invoice.invoice_date >= parsed_start_date)
    if parsed_end_date:
        query = query.filter(Invoice.invoice_date <= parsed_end_date)

    result = query.order_by(desc(Invoice.uploaded_at)).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [invoice.to_dict() for invoice in result.items],
            "page": result.page,
            "pages": result.pages,
            "total": result.total,
        }
    )


@api.get("/invoices/<int:invoice_id>/pdf")
def get_invoice_pdf(invoice_id: int):
    invoice = Invoice.query.get_or_404(invoice_id)
    try:
        pdf_buffer = generate_invoice_pdf(invoice)
    except Exception:
        return jsonify({"error": "Failed to generate invoice PDF."}), 500

    return Response(
        pdf_buffer.getvalue(),
        mimetype="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=invoice_{invoice.invoice_number or invoice.id}.pdf"
        },
    )

@api.delete("/invoices/<int:invoice_id>")
def delete_invoice(invoice_id: int):
    invoice = Invoice.query.get_or_404(invoice_id)
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "Invoice deleted successfully."})


@api.get("/export/csv")
def export_csv():
    invoices = Invoice.query.order_by(desc(Invoice.uploaded_at)).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Vendor", "Invoice Number", "Date", "Amount", "Currency", "Uploaded At"])
    for invoice in invoices:
        writer.writerow(
            [
                invoice.vendor_name,
                invoice.invoice_number,
                invoice.invoice_date.isoformat() if invoice.invoice_date else "",
                invoice.total_amount,
                invoice.currency,
                invoice.uploaded_at.isoformat() if invoice.uploaded_at else "",
            ]
        )
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices.csv"},
    )


@api.get("/analytics")
def analytics():
    monthly_rows = (
        db.session.query(
            extract("year", Invoice.invoice_date).label("year"),
            extract("month", Invoice.invoice_date).label("month"),
            func.sum(Invoice.total_amount).label("total"),
        )
        .filter(Invoice.invoice_date.isnot(None))
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    vendor_rows = (
        db.session.query(Invoice.vendor_name, func.sum(Invoice.total_amount).label("total"))
        .group_by(Invoice.vendor_name)
        .order_by(desc("total"))
        .limit(5)
        .all()
    )
    total_invoices = db.session.query(func.count(Invoice.id)).scalar() or 0
    total_amount = db.session.query(func.coalesce(func.sum(Invoice.total_amount), 0)).scalar()
    recent_invoice = Invoice.query.order_by(desc(Invoice.uploaded_at)).first()

    monthly_totals = [
        {"month": f"{int(row.year)}-{int(row.month):02d}", "total": float(row.total or 0)}
        for row in monthly_rows
    ]
    top_vendors = [
        {"vendor": row.vendor_name or "Unknown", "total": float(row.total or 0)}
        for row in vendor_rows
    ]
    average_value = float(total_amount or 0) / total_invoices if total_invoices else 0

    return jsonify(
        {
            "monthly_totals": monthly_totals,
            "top_vendors": top_vendors,
            "summary": {
                "total_invoices": total_invoices,
                "total_amount": float(total_amount or 0),
                "average_invoice_value": average_value,
                "most_recent_vendor": recent_invoice.vendor_name if recent_invoice else None,
            },
        }
    )
