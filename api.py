import os
import re
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from datetime import datetime
from pydantic import BaseModel, field_validator
from fastapi import Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from models.alert import BreachAlert
from models.plan import Plan
from modules.auth import (
    hash_password, verify_password, create_access_token, get_current_user,
    require_admin, validate_password,
    create_reset_token, verify_reset_token,
    create_refresh_token, verify_refresh_token,
    create_verification_token, verify_email_token,
    hash_api_key,
)
from config import limiter, settings
from modules.activity_logger import log_activity, get_client_ip

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api")


# --- PASSWORD RESET ---

class RefreshBody(BaseModel):
    refresh_token: str

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
    ip = get_client_ip(request)
    log_activity("user.login", user.id, user.email, {}, ip)
    return {
        "token": token, "refresh_token": refresh_token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "verified": bool(user.is_verified)},
    }

@router.post("/auth/refresh", description="Refresh access token")
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

@router.post("/auth/send-verification", description="Send email verification token")
@limiter.limit("3/hour")
def send_verification(request: Request, user: User = Depends(get_current_user)):
    if user.is_verified:
        return {"ok": True, "message": "Email ya verificado"}
    token = create_verification_token(user.id)
    ip = get_client_ip(request)
    log_activity("user.send_verification", user.id, user.email, {}, ip)
    return {"ok": True, "message": "Token de verificación generado", "token": token}

class VerifyEmailBody(BaseModel):
    token: str

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
    ip = get_client_ip(request)
    log_activity("user.verify_email", user.id, user.email, {}, ip)
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

@router.put("/auth/password", description="Change current user password")
@limiter.limit("5/hour")
def change_password(request: Request, body: ChangePasswordBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, user.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password = hash_password(body.new_password)
    db.commit()
    ip = get_client_ip(request)
    log_activity("user.change_password", user.id, user.email, {}, ip)
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
    log_activity("api_key.create", user.id, user.email, {"name": body.name})
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
    log_activity("api_key.delete", user.id, user.email, {"name": k.name})
    return {"ok": True}


# --- ASSETS (monitored domains/emails) ---

class AddAssetBody(BaseModel):
    type: str
    value: str

@router.post("/assets", description="Add a domain or email to monitor")
@limiter.limit("30/hour")
def add_asset(request: Request, body: AddAssetBody, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.type not in ("domain", "email"):
        raise HTTPException(status_code=400, detail="Tipo debe ser 'domain' o 'email'")
    value = body.value.lower().strip()
    if body.type == "email" and "@" not in value:
        raise HTTPException(status_code=400, detail="Email inválido")
    existing = db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == user.id,
        MonitoredAsset.value == value
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya estás monitorizando este activo")
    asset = MonitoredAsset(user_id=user.id, type=body.type, value=value)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    log_activity("asset.add", user.id, user.email, {"type": body.type, "value": value})
    return {"id": asset.id, "type": asset.type, "value": asset.value, "status": asset.status}

@router.get("/assets", description="List monitored assets")
def list_assets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assets = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id).order_by(desc(MonitoredAsset.created_at)).all()
    return [{
        "id": a.id, "type": a.type, "value": a.value, "status": a.status,
        "breaches_found": a.breaches_found,
        "last_checked": str(a.last_checked)[:19] if a.last_checked else None,
        "created_at": str(a.created_at)[:19]
    } for a in assets]

@router.delete("/assets/{asset_id}", description="Remove a monitored asset")
def delete_asset(asset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(MonitoredAsset).filter(MonitoredAsset.id == asset_id, MonitoredAsset.user_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    db.query(BreachAlert).filter(BreachAlert.asset_id == asset_id).delete()
    db.delete(a)
    db.commit()
    log_activity("asset.remove", user.id, user.email, {"type": a.type, "value": a.value})
    return {"ok": True}


# --- INTELLIGENCE / BREACH CHECKS ---

from modules.intel import check_asset as run_intel_check

@router.post("/assets/{asset_id}/check", description="Check a monitored asset for breaches")
@limiter.limit("20/hour")
async def check_asset_endpoint(request: Request, asset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(MonitoredAsset).filter(MonitoredAsset.id == asset_id, MonitoredAsset.user_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    result = await run_intel_check(a.type, a.value)
    a.last_checked = datetime.now()
    a.breaches_found = result["breaches_found"]
    db.commit()

    for breach in result["breaches"]:
        existing = db.query(BreachAlert).filter(
            BreachAlert.user_id == user.id,
            BreachAlert.breach_name == breach["breach_name"],
            BreachAlert.asset_id == asset_id,
        ).first()
        if not existing:
            alert = BreachAlert(
                user_id=user.id,
                asset_id=asset_id,
                breach_name=breach["breach_name"],
                breach_date=breach.get("breach_date"),
                data_classes=breach.get("data_classes", []),
                severity=breach.get("severity", "medium"),
                description=f"Se ha detectado que {a.value} aparece en la filtración de {breach['breach_name']}. Datos expuestos: {', '.join(breach.get('data_classes', []))}.",
            )
            db.add(alert)
            db.commit()

    log_activity("asset.check", user.id, user.email, {"type": a.type, "value": a.value, "breaches": result["breaches_found"]})
    return result


@router.post("/check", description="Check a domain or email without adding it")
@limiter.limit("10/hour")
async def quick_check(request: Request):
    data = await request.json()
    asset_type = data.get("type", "domain")
    asset_value = data.get("value", "")
    if not asset_value:
        raise HTTPException(status_code=400, detail="Valor requerido")
    result = await run_intel_check(asset_type, asset_value)
    return result


# --- ALERTS ---

@router.get("/alerts", description="List breach alerts")
def list_alerts(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(BreachAlert).filter(BreachAlert.user_id == user.id).order_by(desc(BreachAlert.created_at))
    total = q.count()
    alerts = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "unread": db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.read == False).count(),
        "items": [{
            "id": a.id, "breach_name": a.breach_name, "breach_date": a.breach_date,
            "data_classes": a.data_classes, "severity": a.severity,
            "description": a.description, "read": a.read,
            "asset_id": a.asset_id,
            "created_at": str(a.created_at)[:19]
        } for a in alerts]
    }

@router.put("/alerts/{alert_id}/read", description="Mark alert as read")
def mark_alert_read(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(BreachAlert).filter(BreachAlert.id == alert_id, BreachAlert.user_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    a.read = True
    db.commit()
    return {"ok": True}

@router.put("/alerts/read-all", description="Mark all alerts as read")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.read == False).update({"read": True})
    db.commit()
    return {"ok": True}


# --- STATS ---

@router.get("/stats", description="Get dashboard statistics")
@limiter.limit("20/minute")
def get_stats(request: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_assets = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id).count()
    active_assets = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id, MonitoredAsset.status == "active").count()
    total_alerts = db.query(BreachAlert).filter(BreachAlert.user_id == user.id).count()
    unread_alerts = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.read == False).count()
    assets_with_breaches = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id, MonitoredAsset.breaches_found > 0).count()

    severity_counts = {}
    for sev in ("critical", "high", "medium", "low"):
        severity_counts[sev] = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.severity == sev).count()

    return {
        "total_assets": total_assets,
        "active_assets": active_assets,
        "total_alerts": total_alerts,
        "unread_alerts": unread_alerts,
        "assets_with_breaches": assets_with_breaches,
        "severity_counts": severity_counts,
    }


# --- PLANS & SUBSCRIPTION ---

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
    request: Request, plan_id: int = Body(...),
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
    price_id = plan.stripe_price_id_monthly if interval == "month" else (plan.stripe_price_id_yearly or plan.stripe_price_id_monthly)
    if not price_id:
        raise HTTPException(status_code=400, detail="Plan sin precio en Stripe")
    from models.subscription import UserSubscription
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=str(user.id), customer_email=user.email,
            success_url=request.base_url._url.rstrip("/") + "/dashboard?success=1",
            cancel_url=request.base_url._url.rstrip("/") + "/pricing?canceled=1",
            metadata={"plan_id": str(plan.id), "user_id": str(user.id)},
        )
        log_activity("subscription.checkout", user.id, user.email, {"plan": plan.name, "interval": interval, "session_id": session.id})
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

@router.get("/subscription", description="Get current subscription status")
def get_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models.subscription import UserSubscription
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if not sub:
        return {"subscribed": False}
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "subscribed": True, "status": sub.status,
        "plan": {"id": plan.id, "name": plan.name, "price_monthly": plan.price_monthly} if plan else None,
    }

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
        from models.subscription import UserSubscription
        existing = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
        if existing:
            existing.plan_id = plan_id; existing.status = "active"
            existing.stripe_subscription_id = session.get("subscription")
        else:
            db.add(UserSubscription(user_id=user_id, plan_id=plan_id, status="active", stripe_subscription_id=session.get("subscription")))
        db.commit()
        plan_name = db.query(Plan.name).filter(Plan.id == plan_id).scalar()
        log_activity("subscription.completed", user_id, None, {"plan": plan_name, "stripe_session": session.get("id")})
    elif event["type"] == "customer.subscription.updated":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == sub_data["id"]).first()
        if sub:
            sub.status = sub_data["status"]
            db.commit()
            log_activity("subscription.updated", sub.user_id, None, {"status": sub_data["status"]})
    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == sub_data["id"]).first()
        if sub:
            sub.status = "canceled"
            db.commit()
            log_activity("subscription.canceled", sub.user_id, None, {})
    return {"ok": True}


# --- ADMIN ---

@router.get("/admin/users", description="List all users (admin only)")
def admin_list_users(page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(User).order_by(User.created_at.desc())
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    log_activity("admin.list_users", admin.id, admin.email, {"page": page})
    return {"total": total, "page": page, "per_page": per_page, "items": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "created_at": str(u.created_at)[:19]} for u in users]}

@router.delete("/admin/users/{user_id}", description="Delete a user (admin only)")
def admin_delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id: raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    log_activity("admin.delete_user", admin.id, admin.email, {"deleted_user_id": user_id, "deleted_email": u.email, "deleted_name": u.name})
    db.delete(u)
    db.commit()
    return {"ok": True}

@router.get("/admin/stats", description="Global platform stats (admin only)")
def admin_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "total_assets": db.query(MonitoredAsset).count(),
        "total_alerts": db.query(BreachAlert).count(),
        "total_logs": db.query(ActivityLog).count(),
        "assets_by_type": {
            "domain": db.query(MonitoredAsset).filter(MonitoredAsset.type == "domain").count(),
            "email": db.query(MonitoredAsset).filter(MonitoredAsset.type == "email").count(),
        }
    }


@router.get("/admin/activity-actions", description="List unique activity action types (admin only)")
def admin_activity_actions(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(ActivityLog.action).distinct().order_by(ActivityLog.action).all()
    return [r[0] for r in rows]

@router.get("/admin/activity-logs", description="List activity logs (admin only)")
def admin_activity_logs(
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=200),
    action: str | None = Query(None),
    admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    q = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    if action:
        q = q.filter(ActivityLog.action == action)
    total = q.count()
    logs = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total, "page": page, "per_page": per_page,
        "items": [{
            "id": l.id, "user_id": l.user_id, "email": l.email,
            "action": l.action, "details": l.details,
            "ip_address": l.ip_address,
            "created_at": str(l.created_at)[:19],
        } for l in logs],
    }
