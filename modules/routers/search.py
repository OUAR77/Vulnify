import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from models.alert import BreachAlert
from modules.auth import get_current_user

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.search")


@router.get("/search", description="Global search across assets and alerts")
def global_search(
    q: str = Query(..., min_length=1, max_length=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = f"%{q}%"

    assets = db.query(MonitoredAsset).filter(
        MonitoredAsset.user_id == user.id,
        MonitoredAsset.value.ilike(term)
    ).order_by(desc(MonitoredAsset.created_at)).limit(10).all()

    alerts = db.query(BreachAlert).filter(
        BreachAlert.user_id == user.id,
        (BreachAlert.breach_name.ilike(term)) |
        (BreachAlert.description.ilike(term))
    ).order_by(desc(BreachAlert.created_at)).limit(20).all()

    return {
        "assets": [{
            "id": a.id, "type": a.type, "value": a.value, "status": a.status,
            "breaches_found": a.breaches_found,
        } for a in assets],
        "alerts": [{
            "id": a.id, "breach_name": a.breach_name, "severity": a.severity,
            "breach_date": a.breach_date, "read": a.read,
            "created_at": str(a.created_at)[:19],
        } for a in alerts],
        "total_assets": len(assets),
        "total_alerts": len(alerts),
    }
