from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.invoice import Invoice
from app.models.user import User
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import uuid

router = APIRouter(prefix="/invoices", tags=["Invoices"])
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class InvoiceItem(BaseModel):
    name: str
    quantity: float
    price: float

class CreateInvoiceRequest(BaseModel):
    client_name: str
    client_email: str
    items: List[InvoiceItem]
    tax_rate: float = 18.0
    currency: str = "INR"
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

@router.post("/")
def create_invoice(req: CreateInvoiceRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subtotal = sum(item.quantity * item.price for item in req.items)
    tax_amount = subtotal * req.tax_rate / 100
    total = subtotal + tax_amount
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    invoice = Invoice(
        invoice_number=invoice_number,
        user_id=user.id,
        client_name=req.client_name,
        client_email=req.client_email,
        items=[item.dict() for item in req.items],
        subtotal=subtotal,
        tax_rate=req.tax_rate,
        tax_amount=tax_amount,
        total=total,
        currency=req.currency,
        due_date=req.due_date,
        notes=req.notes
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return {"message": "Invoice created!", "invoice_number": invoice_number, "total": total}

@router.get("/")
def list_invoices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoices = db.query(Invoice).filter(Invoice.user_id == user.id).all()
    return invoices

@router.get("/{invoice_id}")
def get_invoice(invoice_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.user_id == user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice