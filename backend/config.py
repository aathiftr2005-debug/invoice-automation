import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
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