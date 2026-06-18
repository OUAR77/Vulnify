import csv
import io
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.user import User
from models.activity_log import ActivityLog
from modules.auth import require_admin, require_admin_totp, verify_password
from models.blog_post import BlogPost
from models.testimonial import Testimonial
from models.faq import FAQ
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


@router.get("/messages/export", description="Export messages as CSV (admin only)")
def admin_export_messages(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.message import Message
    items = db.query(Message).order_by(Message.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Nombre", "Email", "Mensaje", "Leído", "Creado"])
    for m in items:
        w.writerow([m.id, m.name, m.email, m.message, "Sí" if m.read else "No", str(m.created_at)[:19]])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=messages.csv"})


@router.get("/orders/export", description="Export orders as CSV (admin only)")
def admin_export_orders(request: Request, admin: User = Depends(require_admin_totp), db: Session = Depends(get_db)):
    from models.order import Order
    items = db.query(Order).order_by(Order.created_at.desc()).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["ID", "Cliente", "Email", "Servicio", "Descripción", "Importe", "Estado", "Creado"])
    for o in items:
        w.writerow([o.id, o.client_name, o.client_email, o.service, o.description, o.amount, o.status, str(o.created_at)[:19]])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=orders.csv"})


@router.get("/maintenance", description="Get maintenance mode status (admin only)")
def get_maintenance(admin: User = Depends(require_admin_totp)):
    from config import settings
    return {"maintenance_mode": settings.MAINTENANCE_MODE}


@router.put("/maintenance", description="Toggle maintenance mode (admin only)")
def set_maintenance(
    request: Request,
    body: dict,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    from config import settings
    enabled = body.get("maintenance_mode", False)
    import os
    os.environ["MAINTENANCE_MODE"] = "true" if enabled else "false"
    settings.MAINTENANCE_MODE = enabled
    log_activity("admin.maintenance", admin.id, admin.email, {"maintenance_mode": enabled})
    return {"ok": True, "maintenance_mode": enabled}

@router.post("/seed", description="Insert sample blog posts, testimonials, and FAQs")
@limiter.limit("1/minute")
def seed_data(request: Request, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    count = {"posts": 0, "testimonials": 0, "faqs": 0}

    if db.query(BlogPost).count() == 0:
        posts = [
            BlogPost(title="Next.js vs Astro: cuál elegir según tu proyecto", slug="nextjs-vs-astro", tag="Desarrollo",
                     excerpt="Comparativa completa de los dos frameworks más populares.",
                     content="<p>Ambos frameworks son excelentes pero para proyectos diferentes...</p>", author="Vulnify", read_time="5 min", published=True),
            BlogPost(title="Cómo integrar un chatbot en tu web sin saber programar", slug="chatbot-integration", tag="IA",
                     excerpt="Guía paso a paso para añadir inteligencia artificial a tu sitio.",
                     content="<p>Los chatbots con IA son más accesibles que nunca...</p>", author="Vulnify", read_time="7 min", published=True),
            BlogPost(title="Core Web Vitals: la guía definitiva para 2026", slug="core-web-vitals-2026", tag="Rendimiento",
                     excerpt="Todo sobre las métricas que Google usa para posicionar tu web.",
                     content="<p>Google sigue dando prioridad a la experiencia de usuario...</p>", author="Vulnify", read_time="6 min", published=True),
        ]
        db.add_all(posts)
        count["posts"] = len(posts)

    if db.query(Testimonial).count() == 0:
        testimonials = [
            Testimonial(name="Carlos Mendoza", role="CEO", company="TechFlow",
                        content="Vulnify transformó nuestra web. Pasamos de 5 a 40 leads al mes sin invertir en anuncios.", rating=5, featured=True),
            Testimonial(name="Laura García", role="CTO", company="InnovaCorp",
                        content="En 3 semanas teníamos nuestra web lista con chatbot IA incluido. El equipo súper profesional.", rating=5, featured=True),
            Testimonial(name="Miguel Ángel Ruiz", role="Director Operaciones", company="DataSmart",
                        content="Automatizamos todo nuestro reporting. Ahorramos 20h semanales y tenemos datos en tiempo real.", rating=5, featured=True),
        ]
        db.add_all(testimonials)
        count["testimonials"] = len(testimonials)

    if db.query(FAQ).count() == 0:
        faqs = [
            FAQ(question="¿Cuánto tiempo lleva desarrollar una web?", answer= "Depende de la complejidad. Una web corporativa puede estar lista en 2-3 semanas. Proyectos con IA suelen requerir 4-6 semanas.", order=1, published=True),
            FAQ(question="¿Necesito tener claro todo antes de empezar?", answer="No. Te guiamos desde la idea. Incluye una fase de auditoría donde definimos juntos el alcance.", order=2, published=True),
            FAQ(question="¿Ofrecen mantenimiento después del lanzamiento?", answer="Sí. Todos nuestros proyectos incluyen soporte post-lanzamiento y planes de mantenimiento continuo.", order=3, published=True),
            FAQ(question="¿Cómo integran la inteligencia artificial?", answer="Desde chatbots personalizados hasta automatización de procesos y análisis predictivo. Evaluamos tu caso y proponemos la solución óptima.", order=4, published=True),
        ]
        db.add_all(faqs)
        count["faqs"] = len(faqs)

    db.commit()
    return {"ok": True, "inserted": count}
