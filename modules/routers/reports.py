import io
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.asset import MonitoredAsset
from models.alert import BreachAlert
from modules.auth import get_current_user

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.reports")


@router.get("/reports/summary", description="Generate a summary report as JSON")
def summary_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_assets = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id).count()
    total_alerts = db.query(BreachAlert).filter(BreachAlert.user_id == user.id).count()
    unread = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.read == False).count()

    severity_counts = {}
    for sev in ("critical", "high", "medium", "low"):
        severity_counts[sev] = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.severity == sev).count()

    top_breaches = db.query(BreachAlert).filter(
        BreachAlert.user_id == user.id
    ).order_by(desc(BreachAlert.created_at)).limit(10).all()

    return {
        "generated_at": datetime.now().isoformat(),
        "user": user.name,
        "email": user.email,
        "total_assets": total_assets,
        "total_alerts": total_alerts,
        "unread_alerts": unread,
        "severity_counts": severity_counts,
        "recent_alerts": [{
            "breach_name": a.breach_name, "severity": a.severity,
            "breach_date": a.breach_date, "created_at": str(a.created_at)[:19],
        } for a in top_breaches],
    }


@router.get("/reports/pdf", description="Download a PDF summary report")
def pdf_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        from weasyprint import HTML
    except ImportError:
        raise HTTPException(status_code=500, detail="weasyprint no instalado")

    total_assets = db.query(MonitoredAsset).filter(MonitoredAsset.user_id == user.id).count()
    total_alerts = db.query(BreachAlert).filter(BreachAlert.user_id == user.id).count()
    unread = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.read == False).count()

    severity_counts = {}
    for sev in ("critical", "high", "medium", "low"):
        severity_counts[sev] = db.query(BreachAlert).filter(BreachAlert.user_id == user.id, BreachAlert.severity == sev).count()

    alerts = db.query(BreachAlert).filter(
        BreachAlert.user_id == user.id
    ).order_by(desc(BreachAlert.created_at)).limit(20).all()

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Informe Vulnify</title>
<style>
body {{ font-family: Arial, sans-serif; margin: 40px; color: #333; }}
h1 {{ color: #e63946; }}
table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
th {{ background: #f4f4f4; }}
.severity-critical {{ color: #e63946; font-weight: bold; }}
.severity-high {{ color: #e76f51; }}
.severity-medium {{ color: #e9c46a; }}
.severity-low {{ color: #6c757d; }}
</style></head>
<body>
<h1>Informe de Seguridad Vulnify</h1>
<p>Usuario: {user.name} ({user.email})</p>
<p>Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
<hr>
<h2>Resumen</h2>
<ul>
<li>Activos monitorizados: {total_assets}</li>
<li>Alertas totales: {total_alerts}</li>
<li>Alertas no leídas: {unread}</li>
</ul>
<h2>Alertas por severidad</h2>
<table><tr><th>Severidad</th><th>Cantidad</th></tr>
<tr><td>Crítica</td><td>{severity_counts.get('critical', 0)}</td></tr>
<tr><td>Alta</td><td>{severity_counts.get('high', 0)}</td></tr>
<tr><td>Media</td><td>{severity_counts.get('medium', 0)}</td></tr>
<tr><td>Baja</td><td>{severity_counts.get('low', 0)}</td></tr>
</table>
<h2>Últimas alertas</h2>
<table><tr><th>Brecha</th><th>Severidad</th><th>Fecha</th></tr>
{"".join(f'<tr><td>{a.breach_name}</td><td class="severity-{a.severity}">{a.severity}</td><td>{a.breach_date or ""}</td></tr>' for a in alerts)}
</table>
<hr>
<p style="color: #6c757d; font-size: 12px;">Vulnify - Monitorización de Reputación Digital</p>
</body></html>"""

    pdf_bytes = HTML(string=html_content).write_pdf()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=vulnify_report_{user.id}_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )
