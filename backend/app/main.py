from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base
from app.models import User, Invoice
from app.routes import auth_router, invoice_router
import os

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Invoice Automation API",
    description="AI-powered invoice automation for Indian & German markets",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(invoice_router)

@app.get("/")
def root():
    return {"message": "Invoice Automation API is running! 🚀"}

@app.get("/health")
def health():
    return {"status": "ok"}
from app.ai_routes import router as ai_router
app.include_router(ai_router)
from app.routes.pdf import router as pdf_router
app.include_router(pdf_router)