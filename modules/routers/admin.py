import logging
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from models.alert import BreachAlert
from models.activity_log import ActivityLog
from modules.auth import require_admin
from modules.activity_logger import log_activity

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.admin")


@router.get("/users", description="List all users (admin only)")
def admin_list_users(page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100), search: str | None = Query(None), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
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
def admin_delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    log_activity("admin.delete_user", admin.id, admin.email, {"deleted_user_id": user_id, "deleted_email": u.email, "deleted_name": u.name})
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.put("/users/{user_id}/role", description="Change user role (admin only)")
def admin_change_role(user_id: int, role: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Rol inválido")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    old_role = u.role
    u.role = role
    db.commit()
    log_activity("admin.change_role", admin.id, admin.email, {"user_id": user_id, "old_role": old_role, "new_role": role})
    return {"ok": True}


@router.get("/stats", description="Global platform stats (admin only)")
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


@router.get("/activity-actions", description="List unique activity action types (admin only)")
def admin_activity_actions(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(ActivityLog.action).distinct().order_by(ActivityLog.action).all()
    return [r[0] for r in rows]


@router.get("/activity-logs", description="List activity logs (admin only)")
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
