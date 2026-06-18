import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


def database_url() -> str | None:
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {"connect_timeout": 10},
    }
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 10 * 1024 * 1024))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/tmp/invoice-uploads")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)


def validate_config() -> None:
    missing = [key for key in ("DATABASE_URL", "GEMINI_API_KEY") if not os.getenv(key)]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variable(s): {joined}")
