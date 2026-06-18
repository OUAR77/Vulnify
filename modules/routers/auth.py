import re
import secrets
import base64
import logging
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from modules.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
    require_admin, validate_password,
    create_reset_token, verify_reset_token,
    create_refresh_token, verify_refresh_token,
    create_verification_token, verify_email_token,
    hash_api_key,
)
from config import limiter, settings
from modules.email import send_verification_email
from modules.activity_logger import log_activity, get_client_ip
from modules.totp import generate_totp_secret, generate_qr_b64, verify_totp

router = APIRouter(prefix="/api/auth")
logger = logging.getLogger("vulnify.api.auth")


class RefreshBody(BaseModel):
    refresh_token: str

class ForgotPasswordBody(BaseModel):
    email: str


@router.post("/forgot-password", description="Request a password reset email")
@limiter.limit("3/hour")
def forgot_password(request: Request, body: ForgotPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"ok": True, "message": "Si el email existe, recibirás un enlace"}
    token = create_reset_token(user.id)
    from modules.email import send_password_reset
    try:
        send_password_reset(body.email, token)
    except Exception as e:
        logger.warning("Password reset email not sent: %s", e)
    return {"ok": True, "message": "Si el email existe, recibirás un enlace"}


class ResetPasswordBody(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


@router.post("/reset-password", description="Reset password using a valid token")
@limiter.limit("5/hour")
def reset_password(request: Request, body: ResetPasswordBody, db: Session = Depends(get_db)):
    user_id = verify_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password = hash_password(body.password)
    db.commit()
    log_activity("user.reset_password", user.id, user.email, {}, get_client_ip(request))
    return {"ok": True, "message": "Contraseña actualizada"}


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Email inválido")
        return v.lower().strip()


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/register", description="Register a new user")
@limiter.limit("5/minute")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = User(
        name=body.name, email=body.email,
        password=hash_password(body.password),
        role="user", company="", is_verified=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    ip = get_client_ip(request)
    log_activity("user.register", user.id, user.email, {"name": user.name}, ip)
    return {
        "token": token, "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "company": user.company, "bio": user.bio, "avatar": user.avatar, "is_verified": bool(user.is_verified), "totp_enabled": bool(user.totp_enabled), "dark_mode": bool(user.dark_mode), "created_at": str(user.created_at)},
    }


@router.post("/login", description="Login with email and password")
@limiter.limit("10/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    ip = get_client_ip(request)
    if not user or not verify_password(body.password, user.password):
        log_activity("user.login_failed", None, body.email, {}, ip)
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    request.state.user_id = user.id
    if user.totp_enabled:
        return {
            "totp_required": True,
            "user_id": user.id,
            "message": "Código 2FA requerido",
        }
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    log_activity("user.login", user.id, user.email, {}, ip)
    if user.role == "admin":
        try:
            from modules.email import send_admin_login_alert
            send_admin_login_alert(user.email, user.name, ip)
        except Exception as e:
            logger.warning("Admin login alert not sent: %s", e)
    return {
        "token": token, "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "company": user.company, "bio": user.bio, "avatar": user.avatar, "verified": bool(user.is_verified), "totp_enabled": bool(user.totp_enabled), "dark_mode": bool(user.dark_mode), "created_at": str(user.created_at)},
    }


class TotpVerifyBody(BaseModel):
    user_id: int
    code: str


@router.post("/totp/verify-login", description="Verify 2FA code during login")
@limiter.limit("10/minute")
def verify_totp_login(request: Request, body: TotpVerifyBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA no habilitado")
    if not verify_totp(user.totp_secret, body.code):
        log_activity("user.totp_failed", user.id, user.email, {}, get_client_ip(request))
        raise HTTPException(status_code=401, detail="Código 2FA inválido")
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    log_activity("user.login_2fa", user.id, user.email, {}, get_client_ip(request))
    return {
        "token": token, "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "company": user.company, "bio": user.bio, "avatar": user.avatar, "verified": bool(user.is_verified), "totp_enabled": bool(user.totp_enabled), "dark_mode": bool(user.dark_mode), "created_at": str(user.created_at)},
    }


@router.post("/totp/setup", description="Enable 2FA and get QR code")
def setup_totp(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.totp_secret and user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya está habilitado")
    secret = user.totp_secret or generate_totp_secret()
    if not user.totp_secret:
        user.totp_secret = secret
        db.commit()
    qr_b64 = generate_qr_b64(secret, user.email)
    return {"secret": secret, "qr_b64": qr_b64}


@router.post("/totp/enable", description="Confirm and enable 2FA")
def enable_totp(code: str = Body(embed=True), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero haz setup de 2FA")
    if not verify_totp(user.totp_secret, code):
        raise HTTPException(status_code=400, detail="Código inválido")
    user.totp_enabled = True
    db.commit()
    log_activity("user.totp_enabled", user.id, user.email, {})
    return {"ok": True, "message": "2FA activado correctamente"}


@router.post("/totp/disable", description="Disable 2FA")
def disable_totp(code: str = Body(embed=True), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA no está activado")
    if not verify_totp(user.totp_secret, code):
        raise HTTPException(status_code=400, detail="Código inválido")
    user.totp_secret = None
    user.totp_enabled = False
    db.commit()
    log_activity("user.totp_disabled", user.id, user.email, {})
    return {"ok": True, "message": "2FA desactivado"}


@router.post("/refresh", description="Refresh access token")
@limiter.limit("10/minute")
def refresh_access_token(request: Request, body: RefreshBody, db: Session = Depends(get_db)):
    user_id = verify_refresh_token(body.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    token = create_access_token({"sub": str(user.id)})
    ip = get_client_ip(request)
    log_activity("token.refresh", user.id, user.email, {}, ip)
    return {"token": token}


@router.post("/send-verification", description="Send email verification token")
@limiter.limit("3/hour")
def send_verification(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_verified:
        return {"ok": True, "message": "Email ya verificado"}
    token = create_verification_token(user.id)
    sent = send_verification_email(user.email, token, user.name)
    ip = get_client_ip(request)
    log_activity("user.send_verification", user.id, user.email, {}, ip)
    return {"ok": True, "message": "Email de verificación enviado", "sent": sent}


class VerifyEmailBody(BaseModel):
    token: str


@router.post("/verify-email", description="Verify email with token")
@limiter.limit("5/minute")
def verify_email(request: Request, body: VerifyEmailBody, db: Session = Depends(get_db)):
    user_id = verify_email_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_verified = 1
    db.commit()
    ip = get_client_ip(request)
    log_activity("user.verify_email", user.id, user.email, {}, ip)
    return {"ok": True, "message": "Email verificado correctamente"}


@router.get("/me", description="Get current user profile")
@limiter.limit("30/minute")
def me(request: Request, user: User = Depends(get_current_user)):
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "company": user.company, "bio": user.bio,
        "avatar": user.avatar or "",
        "created_at": str(user.created_at),
        "totp_enabled": user.totp_enabled,
        "dark_mode": user.dark_mode,
        "is_verified": bool(user.is_verified),
    }


class ProfileBody(BaseModel):
    name: str | None = None
    company: str | None = None
    bio: str | None = None


@router.put("/profile", description="Update user profile")
@limiter.limit("10/minute")
def update_profile(request: Request, body: ProfileBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    changed = {}
    if body.name is not None: user.name = body.name; changed["name"] = body.name
    if body.company is not None: user.company = body.company; changed["company"] = body.company
    if body.bio is not None: user.bio = body.bio; changed["bio"] = True
    db.commit()
    if changed:
        ip = get_client_ip(request)
        log_activity("user.update_profile", user.id, user.email, changed, ip)
    return {"ok": True}


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        err = validate_password(v)
        if err:
            raise ValueError(err)
        return v


@router.put("/password", description="Change current user password")
@limiter.limit("5/hour")
def change_password(request: Request, body: ChangePasswordBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password = hash_password(body.new_password)
    db.commit()
    ip = get_client_ip(request)
    log_activity("user.change_password", user.id, user.email, {}, ip)
    return {"ok": True, "message": "Contraseña actualizada"}


# --- Dark mode preference ---

class DarkModeBody(BaseModel):
    dark_mode: bool


@router.get("/dark-mode", description="Get dark mode preference")
def get_dark_mode(user: User = Depends(get_current_user)):
    return {"dark_mode": user.dark_mode}


@router.put("/dark-mode", description="Set dark mode preference")
def set_dark_mode(body: DarkModeBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.dark_mode = body.dark_mode
    db.commit()
    log_activity("user.dark_mode", user.id, user.email, {"dark_mode": body.dark_mode})
    return {"ok": True}


@router.post("/avatar", description="Upload profile avatar")
def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        image_bytes = file.file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Archivo vacío")
        import io
        from PIL import Image as PILImage
        img = PILImage.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        img.thumbnail((300, 300), PILImage.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=80)
        b64 = base64.b64encode(buf.getvalue()).decode()
        user.avatar = "data:image/jpeg;base64," + b64
        db.commit()
        log_activity("user.avatar", user.id, user.email, {})
        return {"ok": True, "avatar": user.avatar}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Avatar upload error")
        raise HTTPException(status_code=500, detail=str(e)[:200])
