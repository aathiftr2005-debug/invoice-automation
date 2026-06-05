from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String, unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    items = Column(JSON, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_rate = Column(Float, default=18.0)
    tax_amount = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="draft")
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)