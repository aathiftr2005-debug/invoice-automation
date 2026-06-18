from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()


class Invoice(db.Model):
    __tablename__ = "invoice_automation_invoices"

    id = db.Column(db.Integer, primary_key=True)
    vendor_name = db.Column(db.String(255), nullable=True)
    invoice_number = db.Column(db.String(100), unique=True, nullable=True, index=True)
    invoice_date = db.Column(db.Date, nullable=True)
    total_amount = db.Column(db.Numeric(12, 2), nullable=True)
    currency = db.Column(db.String(10), nullable=False, default="EUR")
    line_items = db.Column(JSONB, nullable=False, default=list)
    file_name = db.Column(db.String(255), nullable=True)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "vendor_name": self.vendor_name,
            "invoice_number": self.invoice_number,
            "invoice_date": self.invoice_date.isoformat() if self.invoice_date else None,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0,
            "currency": self.currency,
            "line_items": self.line_items or [],
            "file_name": self.file_name,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
