import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from models.alert import BreachAlert
from models.plan import Plan
from modules.auth import get_current_user
from config import limiter, settings
from modules.activity_logger import log_activity
from modules.intel import check_asset as run_intel_check

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.assets")


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
    from models.subscription import UserSubscription
    sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == user.id,
        UserSubscription.status == "active"
    ).first()
    if sub:
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    else:
        plan = db.query(Plan).filter(Plan.name == "Gratis").first()
    if plan and plan.max_assets != -1:
        current_count = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id).count()
        if current_count >= plan.max_assets:
            raise HTTPException(status_code=403, detail=f"Límite de {plan.max_assets} activos alcanzado. Actualiza tu plan para añadir más.")
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

    new_alerts = 0
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
            new_alerts += 1

    if new_alerts:
        db.commit()
        # Notify via WebSocket
        try:
            from main import manager
            await manager.send_to_user(user.id, {
                "type": "new_alerts",
                "count": new_alerts,
                "asset": a.value,
            })
        except Exception as e:
            logger.warning("WS notify error: %s", e)
        # Send email if configured
        if settings.SENDGRID_API_KEY and user.notify_email:
            severities = {b.get("severity", "medium") for b in result["breaches"]}
            should_email = False
            for s in severities:
                if s == "critical" and user.notify_critical: should_email = True
                elif s == "high" and user.notify_high: should_email = True
                elif s == "medium" and user.notify_medium: should_email = True
                elif s == "low" and user.notify_low: should_email = True
            if should_email:
                from modules.email import send_breach_alert
                try:
                    send_breach_alert(user.email, user.name, a.value, result["breaches_found"], result["severity"])
                except Exception as e:
                    logger.warning("Alert email error: %s", e)

    log_activity("asset.check", user.id, user.email, {"type": a.type, "value": a.value, "breaches": result["breaches_found"], "new_alerts": new_alerts})
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
