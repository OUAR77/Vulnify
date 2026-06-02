import logging
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.alert import BreachAlert
from modules.auth import get_current_user

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.alerts")


@router.get("/alerts", description="List breach alerts")
def list_alerts(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    severity: str | None = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest|severity)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(BreachAlert).filter(BreachAlert.user_id == user.id)

    if severity:
        q = q.filter(BreachAlert.severity == severity)

    if sort == "newest":
        q = q.order_by(desc(BreachAlert.created_at))
    elif sort == "oldest":
        q = q.order_by(BreachAlert.created_at)
    elif sort == "severity":
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        q = q.order_by(BreachAlert.severity)

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
            "description": a.description, "read": a.read, "resolved": a.resolved,
            "resolved_at": str(a.resolved_at)[:19] if a.resolved_at else None,
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


@router.put("/alerts/{alert_id}/resolve", description="Toggle alert resolved status")
def toggle_resolve_alert(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(BreachAlert).filter(BreachAlert.id == alert_id, BreachAlert.user_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    a.resolved = not a.resolved
    a.resolved_at = datetime.now() if a.resolved else None
    db.commit()
    return {"ok": True, "resolved": a.resolved}


@router.delete("/alerts/{alert_id}", description="Delete a single alert")
def delete_alert(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(BreachAlert).filter(BreachAlert.id == alert_id, BreachAlert.user_id == user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    db.delete(a)
    db.commit()
    return {"ok": True}


@router.delete("/alerts", description="Delete all alerts for user")
def delete_all_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(BreachAlert).filter(BreachAlert.user_id == user.id).delete()
    db.commit()
    return {"ok": True}
