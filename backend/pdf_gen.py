from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


GST_RATE = Decimal("0.18")
VAT_RATE = Decimal("0.19")


def get_tax_context(currency: str) -> dict:
    """Pick tax label/rate based on currency. INR -> GST, everything else -> VAT."""
    if (currency or "").upper() == "INR":
        return {"label": "GST", "rate": GST_RATE}
    return {"label": "VAT", "rate": VAT_RATE}


def compute_tax_breakdown(total_amount, currency: str) -> dict:
    """
    total_amount is assumed tax-inclusive (since that's all we store).
    subtotal = total / (1 + rate); tax = total - subtotal.
    """
    total = Decimal(str(total_amount or 0))
    ctx = get_tax_context(currency)
    rate = ctx["rate"]
    subtotal = (total / (Decimal("1") + rate)).quantize(Decimal("0.01"))
    tax_amount = (total - subtotal).quantize(Decimal("0.01"))
    return {
        "label": ctx["label"],
        "rate_percent": f"{(rate * 100):.0f}%",
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
    }


def generate_invoice_pdf(invoice) -> BytesIO:
    """
    invoice: an object with attributes vendor_name, invoice_number, invoice_date,
    total_amount, currency, line_items (list of dicts), file_name, uploaded_at
    Returns a BytesIO buffer containing the PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle", parent=styles["Heading1"], fontSize=20, spaceAfter=2
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#555555")
    )

    elements = []

    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Paragraph(f"Invoice #: {invoice.invoice_number or 'N/A'}", meta_style))
    invoice_date_str = invoice.invoice_date.isoformat() if invoice.invoice_date else "N/A"
    elements.append(Paragraph(f"Date: {invoice_date_str}", meta_style))
    elements.append(Spacer(1, 10 * mm))

    elements.append(Paragraph(f"<b>Vendor:</b> {invoice.vendor_name or 'Unknown Vendor'}", styles["Normal"]))
    elements.append(Spacer(1, 8 * mm))

    table_data = [["Description", "Qty", "Unit Price", "Amount"]]
    line_items = invoice.line_items or []
    if line_items:
        for item in line_items:
            table_data.append(
                [
                    str(item.get("description", "")),
                    str(item.get("quantity", "")),
                    f"{item.get('unit_price', 0):.2f}",
                    f"{item.get('amount', 0):.2f}",
                ]
            )
    else:
        table_data.append(["No line item detail available", "", "", f"{float(invoice.total_amount or 0):.2f}"])

    items_table = Table(table_data, colWidths=[80 * mm, 25 * mm, 35 * mm, 35 * mm])
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d3748")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f7f7")]),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(items_table)
    elements.append(Spacer(1, 8 * mm))

    breakdown = compute_tax_breakdown(invoice.total_amount, invoice.currency)
    currency = invoice.currency or "EUR"

    summary_data = [
        ["Subtotal", f"{currency} {breakdown['subtotal']:.2f}"],
        [f"{breakdown['label']} ({breakdown['rate_percent']}, estimated)", f"{currency} {breakdown['tax_amount']:.2f}"],
        ["Total", f"{currency} {breakdown['total']:.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[140 * mm, 35 * mm])
    summary_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 10 * mm))

    note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#888888"))
    elements.append(
        Paragraph(
            f"Note: {breakdown['label']} amount is an estimated breakdown based on a "
            f"{breakdown['rate_percent']} rate applied to the stored total. It is not sourced "
            "from a separately stored tax field.",
            note_style,
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer