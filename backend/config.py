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


def build_safe_database_uri() -> str:
    primary = database_url()
    if not primary:
        return "sqlite:///dev_fallback.db"
    return primary


class Config:
    SQLALCHEMY_DATABASE_URI = build_safe_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,
        "max_overflow": 2,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "connect_args": {
            "connect_timeout": 10,
            "sslmode": "require",
        },
    }
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 10 * 1024 * 1024))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/tmp/invoice-uploads")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)


def validate_config() -> None:
    missing = [key for key in ("DATABASE_URL", "GEMINI_API_KEY") if not os.getenv(key)]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variable(s): {joined}")
