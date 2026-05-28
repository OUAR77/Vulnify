import csv
import io
import os
import re
import shutil
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import Response
from datetime import date, datetime
from pydantic import BaseModel, field_validator
from fastapi import Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from database import get_db
from models.user import User
from models.scan import Scan
from models.plan import Plan
from modules.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
    require_admin, require_verified, validate_password,
    create_reset_token, verify_reset_token,
    create_refresh_token, verify_refresh_token,
    create_verification_token, verify_email_token,
    hash_api_key, get_user_by_api_key,
)
from config import limiter, settings

router = APIRouter(prefix="/api")


# --- FILE VALIDATION ---

ALLOWED_EXTENSIONS = {ext.lower() for ext in settings.ALLOWED_EXTENSIONS}


def validate_file(file: UploadFile) -> str | None:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if not ext or ext not in ALLOWED_EXTENSIONS:
        return f"Tipo de archivo no permitido: {ext}. Permitidos: {', '.join(settings.ALLOWED_EXTENSIONS)}"

    content_type = file.content_type or ""
    ALLOWED_MIME_TYPES = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif", ".pdf": "application/pdf",
        ".txt": "text/plain", ".zip": "application/zip",
        ".md": "text/markdown", ".json": "application/json",
    }
    expected_mime = ALLOWED_MIME_TYPES.get(ext)
    if expected_mime and content_type and content_type != expected_mime and not content_type.startswith("image/"):
        return f"Tipo de contenido no coincide con la extensión del archivo. Se esperaba {expected_mime}, se recibió {content_type}"

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.MAX_UPLOAD_SIZE_BYTES:
        return f"Archivo demasiado grande. Máximo {settings.MAX_UPLOAD_SIZE_MB}MB"
    return None


def sanitize_filename(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    name = re.sub(r"[^\w\-]", "_", name)[:64]
    ext = ext.lower()
    return f"{name}{ext}"


# --- PASSWORD RESET ---

class RefreshBody(BaseModel):
    refresh_token: str


class VerifyEmailBody(BaseModel):
    token: str


class ForgotPasswordBody(BaseModel):
    email: str


@router.post("/auth/forgot-password", description="Request a password reset email")
@limiter.limit("3/hour")
def forgot_password(request: Request, body: ForgotPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        return {"ok": True, "message": "Si el email existe, recibirás un enlace"}
    token = create_reset_token(user.id)
    from modules.email import send_password_reset
    import logging
    logger = logging.getLogger("vulnify.api")
    try:
        sent = send_password_reset(body.email, token)
        if not sent:
            logger.warning("Password reset email not sent for user %s (SendGrid not configured)", user.id)
    except Exception as e:
        logger.error("Failed to send password reset email for user %s: %s", user.id, e)
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


@router.post("/auth/reset-password", description="Reset password using a valid token")
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
    return {"ok": True, "message": "Contraseña actualizada"}


# --- API KEYS ---

class ApiKeyCreateBody(BaseModel):
    name: str


@router.post("/auth/api-keys", description="Create a new API key")
def create_api_key(body: ApiKeyCreateBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key_value = f"vul_{secrets.token_urlsafe(32)}"
    from models.apikey import ApiKey
    api_key = ApiKey(user_id=user.id, name=body.name, key=hash_api_key(key_value))
    db.add(api_key)
    db.commit()
    return {"ok": True, "key": key_value, "name": body.name, "id": api_key.id}


@router.get("/auth/api-keys", description="List user API keys")
def list_api_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.apikey import ApiKey
    keys = db.query(ApiKey).filter(ApiKey.user_id == user.id).all()
    return [{"id": k.id, "name": k.name, "created_at": str(k.created_at)[:19]} for k in keys]


@router.delete("/auth/api-keys/{key_id}", description="Delete an API key")
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.apikey import ApiKey
    k = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not k:
        raise HTTPException(status_code=404, detail="API key no encontrada")
    db.delete(k)
    db.commit()
    return {"ok": True}


# --- AUTH ---

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


@router.post("/auth/register", description="Register a new user")
@limiter.limit("5/minute")
def register(request: Request, body: RegisterBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
        role="user",
        company="",
        is_verified=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    return {
        "token": token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@router.post("/auth/login", description="Login with email and password")
@limiter.limit("10/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id)
    return {
        "token": token,
        "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "verified": bool(user.is_verified)},
    }


@router.post("/auth/refresh", description="Refresh access token using refresh token")
@limiter.limit("10/minute")
def refresh_access_token(request: Request, body: RefreshBody, db: Session = Depends(get_db)):
    user_id = verify_refresh_token(body.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token inválido o expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    token = create_access_token({"sub": str(user.id)})
    return {"token": token}


@router.post("/auth/send-verification", description="Send email verification token")
@limiter.limit("3/hour")
def send_verification(request: Request, user: User = Depends(get_current_user)):
    if user.is_verified:
        return {"ok": True, "message": "Email ya verificado"}
    token = create_verification_token(user.id)
    return {"ok": True, "message": "Token de verificación generado", "token": token}


@router.post("/auth/verify-email", description="Verify email with token")
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
    return {"ok": True, "message": "Email verificado correctamente"}


@router.get("/auth/me", description="Get current user profile")
@limiter.limit("30/minute")
def me(request: Request, user: User = Depends(get_current_user)):
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "role": user.role, "company": user.company, "bio": user.bio,
        "created_at": str(user.created_at)
    }


class ProfileBody(BaseModel):
    name: str | None = None
    company: str | None = None
    bio: str | None = None


@router.put("/auth/profile", description="Update user profile")
@limiter.limit("10/minute")
def update_profile(request: Request, body: ProfileBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.name is not None:
        user.name = body.name
    if body.company is not None:
        user.company = body.company
    if body.bio is not None:
        user.bio = body.bio
    db.commit()
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


@router.put("/auth/password", description="Change current user password")
@limiter.limit("5/hour")
def change_password(
    request: Request,
    body: ChangePasswordBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password = hash_password(body.new_password)
    db.commit()
    return {"ok": True, "message": "Contraseña actualizada"}


# --- SCANNER ---

from modules.scanner import scan_domain as run_scan
try:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except ImportError:
    from weasyprint import HTML
    HAS_WEASYPRINT = True
except OSError:
    HAS_WEASYPRINT = False
    HTML = None
from fastapi.responses import FileResponse
import tempfile
import json


@router.post("/scan", description="Scan a domain for security issues")
@limiter.limit("20/hour")
async def api_scan(request: Request, user: User | None = Depends(get_current_user), db: Session = Depends(get_db)):
    data = await request.json()
    domain = data.get("domain", "")
    if not domain:
        raise HTTPException(status_code=400, detail="Dominio requerido")
    result = await run_scan(domain)

    if user:
        scan = Scan(
            user_id=user.id,
            domain=result["domain"],
            score=result["scores"]["general"],
            issues_count=len(result["issues"]),
            ssl_valid=1 if result["ssl"].get("valid") else 0,
            ssl_days_left=result["ssl"].get("daysLeft", 0),
            headers_score=result["scores"]["headers"],
            result=result,
        )
        db.add(scan)
        db.commit()

    return result


@router.post("/scan/pdf", description="Generate PDF report for a scan")
@limiter.limit("10/hour")
async def api_scan_pdf(request: Request):
    if not HAS_WEASYPRINT:
        raise HTTPException(status_code=503, detail="Generación de PDF no disponible en este servidor")

    data = await request.json()
    result = await run_scan(data.get("domain", ""))

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Informe Vulnify</title>
<style>
body {{ font-family: 'Inter', sans-serif; padding: 40px; background: #fff; color: #111; }}
h1 {{ font-size: 24px; margin-bottom: 4px; }}
.sub {{ color: #666; font-size: 14px; margin-bottom: 30px; }}
.score {{ font-size: 48px; font-weight: 700; text-align: center; margin: 20px 0; }}
.section {{ margin: 20px 0; }}
.section h2 {{ font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }}
.item {{ padding: 4px 0; font-size: 13px; }}
.ok {{ color: #22c55e; }} .warn {{ color: #eab308; }} .fail {{ color: #ef4444; }}</style></head><body>
<h1>Vulnify</h1>
<div class="sub">Informe de Seguridad - {result['domain']} - {result['scannedAt'][:10]}</div>
<div class="score">{result['scores']['general']}/100</div>
<div class="section"><h2>SSL / TLS</h2>
<p>Válido: {'Sí' if result['ssl'].get('valid') else 'No'}</p>
<p>Días restantes: {result['ssl'].get('daysLeft', 'N/A')}</p>
<p>Emisor: {result['ssl'].get('issuer', 'N/A')}</p></div>
<div class="section"><h2>Cabeceras de Seguridad</h2>
{''.join(f'<p class="{c["status"]}">{"✓" if c["status"]=="ok" else "⚠" if c["status"]=="warn" else "✗"} {c["name"]}: {c["desc"]}</p>' for c in result['headers'])}</div>
<div class="section"><h2>DNS</h2>
{''.join(f'<p>{d["type"]}: {d["value"]}</p>' for d in result['dns'])}</div>
<div class="section"><h2>Problemas Detectados</h2>
{''.join(f'<p>[{i["severity"].upper()}] {i["text"]}</p>' for i in result['issues']) if result['issues'] else '<p>No se detectaron problemas</p>'}</div>
</body></html>"""

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        HTML(string=html).write_pdf(tmp.name)
        tmp_path = tmp.name

    return FileResponse(tmp_path, media_type='application/pdf', filename=f"vulnify-{result['domain']}.pdf",
                        headers={"Content-Disposition": f"attachment; filename=vulnify-{result['domain']}.pdf"})


# --- SCAN HISTORY ---

@router.get("/scans", description="List user scan history")
@limiter.limit("30/minute")
def list_scans(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Scan).filter(Scan.user_id == user.id)
    total = q.count()
    scans = q.order_by(desc(Scan.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": s.id,
            "domain": s.domain,
            "score": s.score,
            "issues_count": s.issues_count,
            "ssl_valid": bool(s.ssl_valid),
            "created_at": str(s.created_at)[:19]
        } for s in scans]
    }


@router.get("/scans/{scan_id}", description="Get scan details")
def get_scan(scan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Escaneo no encontrado")
    return s.result


# --- STATS ---

@router.get("/stats", description="Get platform statistics")
@limiter.limit("20/minute")
def get_stats(request: Request, db: Session = Depends(get_db)):
    total_scans = db.query(Scan).count()
    total_users = db.query(User).count()
    total_domains = db.query(Scan.domain).distinct().count()
    avg_score = db.query(func.avg(Scan.score)).scalar() or 0
    recent_scans = db.query(Scan).order_by(desc(Scan.created_at)).limit(5).all()

    return {
        "total_scans": total_scans,
        "total_users": total_users,
        "total_domains": total_domains,
        "avg_score": round(float(avg_score), 1),
        "recent_scans": [{
            "domain": s.domain,
            "score": s.score,
            "created_at": str(s.created_at)[:19]
        } for s in recent_scans]
    }


# --- PLANS ---

@router.get("/plans", description="List active subscription plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.active == True).order_by(Plan.price_monthly).all()
    return [{
        "id": p.id, "name": p.name, "description": p.description,
        "price_monthly": p.price_monthly, "price_yearly": p.price_yearly,
        "features": p.features,
    } for p in plans]


@router.post("/subscribe", description="Create Stripe Checkout Session for subscription")
def subscribe(
    request: Request,
    plan_id: int = Body(...),
    interval: str = Body("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    price = plan.price_monthly if interval == "month" else (plan.price_yearly or plan.price_monthly)

    if price == 0:
        return {"checkout_url": None, "free": True}

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe no configurado")

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    price_id = plan.stripe_price_id_monthly if interval == "month" else plan.stripe_price_id_yearly
    if not price_id:
        raise HTTPException(status_code=400, detail="Este plan no tiene precio configurado en Stripe")

    from models.subscription import UserSubscription
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=str(user.id),
            customer_email=user.email,
            success_url=request.base_url._url.rstrip("/") + "/dashboard?success=1",
            cancel_url=request.base_url._url.rstrip("/") + "/pricing?canceled=1",
            metadata={"plan_id": str(plan.id), "user_id": str(user.id)},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear sesión: {str(e)}")


@router.get("/subscription", description="Get current subscription status")
def get_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.subscription import UserSubscription
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if not sub:
        return {"subscribed": False}
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "subscribed": True,
        "status": sub.status,
        "plan": {"id": plan.id, "name": plan.name, "price_monthly": plan.price_monthly} if plan else None,
        "current_period_start": str(sub.current_period_start) if sub.current_period_start else None,
        "current_period_end": str(sub.current_period_end) if sub.current_period_end else None,
    }


# --- STRIPE WEBHOOK ---

@router.post("/stripe/webhook", description="Stripe webhook endpoint")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return {"ok": True}
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan_id = int(session["metadata"]["plan_id"])
        subscription_id = session.get("subscription")
        customer_id = session.get("customer")

        from models.subscription import UserSubscription
        existing = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
        if existing:
            existing.stripe_subscription_id = subscription_id
            existing.stripe_customer_id = customer_id
            existing.plan_id = plan_id
            existing.status = "active"
        else:
            sub = UserSubscription(
                user_id=user_id,
                plan_id=plan_id,
                stripe_subscription_id=subscription_id,
                stripe_customer_id=customer_id,
                status="active",
            )
            db.add(sub)
        db.commit()

    elif event["type"] == "customer.subscription.updated":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == sub_data["id"]
        ).first()
        if sub:
            sub.status = sub_data["status"]
            from datetime import datetime
            if sub_data.get("current_period_start"):
                sub.current_period_start = datetime.fromtimestamp(sub_data["current_period_start"])
            if sub_data.get("current_period_end"):
                sub.current_period_end = datetime.fromtimestamp(sub_data["current_period_end"])
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(
            UserSubscription.stripe_subscription_id == sub_data["id"]
        ).first()
        if sub:
            sub.status = "canceled"
            db.commit()

    return {"ok": True}


# --- ADMIN ---

@router.get("/admin/users", description="List all users (admin only)")
def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(User).order_by(User.created_at.desc())
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "company": u.company, "bio": u.bio, "created_at": str(u.created_at)[:19]
        } for u in users]
    }


class AdminUpdateUserBody(BaseModel):
    role: str | None = None
    name: str | None = None
    company: str | None = None
    bio: str | None = None


@router.put("/admin/users/{user_id}", description="Update user details (admin only)")
def admin_update_user(user_id: int, body: AdminUpdateUserBody, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if body.role and body.role in ("user", "admin"):
        u.role = body.role
    if body.name is not None:
        u.name = body.name
    if body.company is not None:
        u.company = body.company
    if body.bio is not None:
        u.bio = body.bio
    db.commit()
    return {"ok": True}


@router.delete("/admin/users/{user_id}", description="Delete a user (admin only)")
def admin_delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.get("/admin/scans", description="List all scans (admin only)")
def admin_list_scans(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Scan).order_by(Scan.created_at.desc())
    total = q.count()
    scans = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [{
            "id": s.id, "domain": s.domain, "score": s.score,
            "issues_count": s.issues_count, "user_id": s.user_id,
            "created_at": str(s.created_at)[:19]
        } for s in scans]
    }


# --- EXPORT ---

@router.get("/scans/export/csv", description="Export scans as CSV")
@limiter.limit("5/minute")
def export_scans_csv(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Scan).filter(Scan.user_id == user.id).order_by(desc(Scan.created_at))
    scans = q.all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Dominio", "Puntuacion", "Problemas", "SSL Valido", "Creado"])
    for s in scans:
        w.writerow([s.id, s.domain, s.score, s.issues_count, "Si" if s.ssl_valid else "No", str(s.created_at)[:19]])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=escaneos.csv"}
    )
