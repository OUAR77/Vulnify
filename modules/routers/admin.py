import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.activity_log import ActivityLog
from modules.auth import require_admin, require_admin_totp, verify_password
from modules.activity_logger import log_activity, get_client_ip
from config import limiter

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.admin")


@router.get("/users", description="List all users (admin only)")
@limiter.limit("30/minute")
def admin_list_users(request: Request, page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100), search: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    q = db.query(User).order_by(User.created_at.desc())
    if search:
        q = q.filter(
            User.email.ilike(f"%{search}%") |
            User.name.ilike(f"%{search}%")
        )
    total = q.count()
    users = q.offset((page - 1) * per_page).limit(per_page).all()
    log_activity("admin.list_users", admin.id, admin.email, {"page": page, "search": search})
    return {"total": total, "page": page, "per_page": per_page, "items": [{
        "id": u.id, "name": u.name, "email": u.email, "role": u.role,
        "is_verified": bool(u.is_verified), "totp_enabled": u.totp_enabled,
        "created_at": str(u.created_at)[:19],
    } for u in users]}


@router.delete("/users/{user_id}", description="Delete a user (admin only)")
@limiter.limit("10/minute")
def admin_delete_user(request: Request, user_id: int, password: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta. Debes confirmar tu contraseña para esta acción.")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    log_activity("admin.delete_user", admin.id, admin.email, {"deleted_user_id": user_id, "deleted_email": u.email, "deleted_name": u.name}, get_client_ip(request))
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/role", description="Change user role (admin only)")
@limiter.limit("10/minute")
def admin_change_role(request: Request, user_id: int, role: str = Query(...), password: str | None = Query(None), admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta. Debes confirmar tu contraseña para esta acción.")
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    old_role = u.role
    u.role = role
    db.commit()
    log_activity("admin.change_role", admin.id, admin.email, {"user_id": user_id, "old_role": old_role, "new_role": role}, get_client_ip(request))
    return {"ok": True}


@router.get("/stats", description="Global platform stats (admin only)")
@limiter.limit("30/minute")
def admin_stats(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.message import Message
    from models.order import Order
    return {
        "total_users": db.query(User).count(),
        "total_messages": db.query(Message).count(),
        "total_orders": db.query(Order).count(),
        "total_logs": db.query(ActivityLog).count(),
    }


@router.get("/activity-actions", description="List unique activity action types (admin only)")
@limiter.limit("30/minute")
def admin_activity_actions(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    rows = db.query(ActivityLog.action).distinct().order_by(ActivityLog.action).all()
    return [r[0] for r in rows]


@router.get("/activity-logs", description="List activity logs (admin only)")
@limiter.limit("30/minute")
def admin_activity_logs(
    request: Request,
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=200),
    action: str | None = Query(None),
    admin: User = Depends(require_admin_totp), db: Session = Depends(get_db),
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


@router.post("/verify-password", description="Verify admin password for sensitive actions")
@limiter.limit("10/minute")
def admin_verify_password(request: Request, admin: User = Depends(require_admin_totp)):
    return {"ok": True}
