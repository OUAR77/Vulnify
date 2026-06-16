import hashlib
import re
import secrets
import bcrypt as _bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.apikey import ApiKey
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def validate_password(password: str) -> str | None:
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres"
    if not re.search(r"[A-Z]", password):
        return "La contraseña debe tener al menos una mayúscula"
    if not re.search(r"[a-z]", password):
        return "La contraseña debe tener al menos una minúscula"
    if not re.search(r"\d", password):
        return "La contraseña debe tener al menos un número"
    return None


def create_access_token(data: dict) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expires})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    api_key: str = Depends(api_key_header),
    db: Session = Depends(get_db),
):
    user = None
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id is not None:
                user = db.query(User).filter(User.id == int(user_id)).first()
        except JWTError:
            pass
    if not user and api_key:
        hashed = hash_api_key(api_key)
        key_record = db.query(ApiKey).filter(ApiKey.key == hashed).first()
        if key_record:
            user = db.query(User).filter(User.id == key_record.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    return user


def require_verified(user: User = Depends(get_current_user)):
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email no verificado")
    return user


def create_reset_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    return jwt.encode({"sub": str(user_id), "type": "reset", "exp": expires}, settings.SECRET_KEY, algorithm="HS256")


def verify_reset_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "reset":
            return None
        return int(payload["sub"])
    except JWTError:
        return None


def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol admin")
    return user


def require_admin_totp(user: User = Depends(require_admin)):
    if not user.totp_enabled:
        raise HTTPException(status_code=403, detail="Debes habilitar 2FA antes de acceder al panel admin. Ve a tu perfil y configura la autenticación de dos factores.")
    return user


# --- API KEYS (SHA-256) ---


def get_user_by_api_key(
    api_key: str = Depends(api_key_header),
    db: Session = Depends(get_db),
):
    if not api_key:
        return None
    hashed = hash_api_key(api_key)
    key_record = db.query(ApiKey).filter(ApiKey.key == hashed).first()
    if not key_record:
        return None
    user = db.query(User).filter(User.id == key_record.user_id).first()
    return user


# --- REFRESH TOKENS ---

def create_refresh_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=90)
    return jwt.encode(
        {"sub": str(user_id), "type": "refresh", "exp": expires},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def verify_refresh_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            return None
        return int(payload["sub"])
    except JWTError:
        return None


# --- EMAIL VERIFICATION ---

def create_verification_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode(
        {"sub": str(user_id), "type": "verify", "exp": expires},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def verify_email_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "verify":
            return None
        return int(payload["sub"])
    except JWTError:
        return None
