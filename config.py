import json
import os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vulnify.db")
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))
    CORS_ORIGINS: list = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:8000"]'))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
    ALLOWED_EXTENSIONS: list = os.getenv("ALLOWED_EXTENSIONS", ".png,.jpg,.jpeg,.gif,.pdf,.txt,.zip,.md").split(",")
    @property
    def MAX_UPLOAD_SIZE_BYTES(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_STARTER_MONTHLY: str = os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "")
    STRIPE_PRICE_STARTER_YEARLY: str = os.getenv("STRIPE_PRICE_STARTER_YEARLY", "")
    STRIPE_PRICE_PROFESIONAL_MONTHLY: str = os.getenv("STRIPE_PRICE_PROFESIONAL_MONTHLY", "")
    STRIPE_PRICE_PROFESIONAL_YEARLY: str = os.getenv("STRIPE_PRICE_PROFESIONAL_YEARLY", "")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SITE_URL: str = os.getenv("SITE_URL", "https://vulnify.es")
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:14b")
    MAINTENANCE_MODE: bool = os.getenv("MAINTENANCE_MODE", "false").lower() == "true"


settings = Settings()

if settings.ENVIRONMENT == "production" and settings.SECRET_KEY in ("dev-secret-change-in-production", ""):
    raise RuntimeError("SECRET_KEY must be set in production")


def _user_key_func(request):
    if hasattr(request.state, "user_id") and request.state.user_id:
        return f"user_{request.state.user_id}"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=_user_key_func)
