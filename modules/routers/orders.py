import logging
import base64
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.order import Order
from models.order_photo import OrderPhoto
from models.order_log import OrderLog
from models.user import User
from modules.auth import require_admin_totp, verify_password
from modules.email import send_order_status_email
from config import limiter, settings

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.orders")


class OrderCreate(BaseModel):
    client_name: str
    client_email: str
    description: str = ""
    service: str
    amount: float = 0
    status: str = "pending"


class OrderUpdate(BaseModel):
    client_name: str | None = None
    client_email: str | None = None
    description: str | None = None
    service: str | None = None
    amount: float | None = None
    status: str | None = None


@router.get("/orders", description="List orders (admin only)")
@limiter.limit("30/minute")
def admin_list_orders(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    q = db.query(Order).order_by(Order.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": o.id,
                "user_id": o.user_id,
                "client_name": o.client_name,
                "client_email": o.client_email,
                "description": o.description,
                "service": o.service,
                "amount": o.amount,
                "status": o.status,
                "created_at": str(o.created_at)[:19],
            }
            for o in items
        ],
    }


@router.post("/orders", description="Create an order (admin only)")
@limiter.limit("20/minute")
def admin_create_order(
    request: Request,
    data: OrderCreate,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.client_email).first()
    order = Order(
        user_id=user.id if user else None,
        client_name=data.client_name,
        client_email=data.client_email,
        description=data.description,
        service=data.service,
        amount=data.amount,
        status=data.status,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "id": order.id,
        "user_id": order.user_id,
        "client_name": order.client_name,
        "client_email": order.client_email,
        "description": order.description,
        "service": order.service,
        "amount": order.amount,
        "status": order.status,
        "created_at": str(order.created_at)[:19],
    }


@router.put("/orders/{order_id}", description="Update an order (admin only)")
@limiter.limit("20/minute")
def admin_update_order(
    request: Request,
    order_id: int,
    data: OrderUpdate,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if data.client_name is not None:
        order.client_name = data.client_name
    if data.client_email is not None:
        order.client_email = data.client_email
        user = db.query(User).filter(User.email == data.client_email).first()
        order.user_id = user.id if user else None
    if data.description is not None:
        order.description = data.description
    if data.service is not None:
        order.service = data.service
        _add_log(db, order_id, "service", "", data.service, admin.name)
    if data.amount is not None:
        old = str(order.amount)
        order.amount = data.amount
        _add_log(db, order_id, "amount", old, str(data.amount), admin.name)
    if data.status is not None and data.status != order.status:
        old_status = order.status
        order.status = data.status
        _add_log(db, order_id, "status", old_status, data.status, admin.name)
        # Send email notification
        client = db.query(User).filter(User.email == order.client_email).first()
        if client and client.email:
            send_order_status_email(client.email, client.name or client.email, order.id, order.service, data.status)
    db.commit()
    return {"ok": True}


def _add_log(db: Session, order_id: int, field: str, old: str, new: str, by: str):
    entry = OrderLog(order_id=order_id, field=field, old_value=old, new_value=new, changed_by=by)
    db.add(entry)


@router.delete("/orders/{order_id}", description="Delete an order (admin only)")
@limiter.limit("10/minute")
def admin_delete_order(
    request: Request,
    order_id: int,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(order)
    db.commit()
    return {"ok": True}


@router.post("/orders/{order_id}/photos", description="Upload a progress photo (admin only)")
def admin_upload_photo(
    order_id: int,
    file: UploadFile = File(...),
    caption: str = Form(""),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return JSONResponse(status_code=404, content={"detail": "Pedido no encontrado"})
        image_bytes = file.file.read()
        if not image_bytes:
            return JSONResponse(status_code=400, content={"detail": "Archivo vacío"})
        import io
        from PIL import Image as PILImage
        img = PILImage.open(io.BytesIO(image_bytes))
        max_size = 1200
        if img.width > max_size or img.height > max_size:
            ratio = max_size / max(img.width, img.height)
            img = img.resize((int(img.width * ratio), int(img.height * ratio)), PILImage.LANCZOS)
        buf = io.BytesIO()
        img.convert("RGB").save(buf, "JPEG", quality=80)
        b64 = base64.b64encode(buf.getvalue()).decode()
        image_data = "data:image/jpeg;base64," + b64
        photo = OrderPhoto(order_id=order_id, image_data=image_data, caption=caption)
        db.add(photo)
        db.commit()
        db.refresh(photo)
        return {"id": photo.id, "caption": photo.caption, "created_at": str(photo.created_at)[:19]}
    except Exception as e:
        logger.exception("Upload photo error")
        return JSONResponse(status_code=500, content={"detail": str(e)[:300]})


@router.get("/orders/{order_id}/photos", description="Get progress photos for an order (admin only)")
def admin_get_photos(
    order_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    photos = (
        db.query(OrderPhoto)
        .filter(OrderPhoto.order_id == order_id)
        .order_by(OrderPhoto.created_at.asc())
        .all()
    )
    return [
        {"id": p.id, "image_data": p.image_data, "caption": p.caption, "created_at": str(p.created_at)[:19]}
        for p in photos
    ]


@router.delete("/orders/{order_id}/photos/{photo_id}", description="Delete a progress photo (admin only)")
def admin_delete_photo(
    order_id: int,
    photo_id: int,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    photo = db.query(OrderPhoto).filter(OrderPhoto.id == photo_id, OrderPhoto.order_id == order_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    db.delete(photo)
    db.commit()
    return {"ok": True}


@router.delete("/orders/{order_id}/photos", description="Delete all progress photos for an order (admin only)")
def admin_delete_all_photos(
    order_id: int,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    deleted = db.query(OrderPhoto).filter(OrderPhoto.order_id == order_id).delete()
    db.commit()
    return {"ok": True, "deleted": deleted}


@router.get("/orders/{order_id}/timeline", description="Get order timeline (admin only)")
def admin_order_timeline(
    order_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(OrderLog)
        .filter(OrderLog.order_id == order_id)
        .order_by(OrderLog.created_at.asc())
        .all()
    )
    return [
        {"id": l.id, "field": l.field, "old_value": l.old_value, "new_value": l.new_value, "changed_by": l.changed_by, "created_at": str(l.created_at)[:19]}
        for l in logs
    ]


@router.get("/orders/{order_id}/invoice", description="Generate PDF invoice for an order (admin only)")
def admin_order_invoice(
    order_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    user = db.query(User).filter(User.id == order.user_id).first() if order.user_id else None
    client_name = user.name if user else order.client_name
    client_email = user.email if user else order.client_email
    date_str = str(order.created_at)[:10] if order.created_at else datetime.now().strftime("%Y-%m-%d")
    status_labels = {"pending": "Pendiente", "in_progress": "En progreso", "completed": "Pagada", "cancelled": "Cancelada"}
    html = """
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Helvetica','Arial',sans-serif; color: #333; padding: 40px; }
  h1 { color: #111; font-size: 24px; margin-bottom: 4px; }
  .meta { color: #888; font-size: 13px; margin-bottom: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { text-align: left; padding: 10px 12px; background: #f5f5f5; font-size: 13px; color: #666; }
  td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
  .total td { font-weight: 700; font-size: 16px; border-top: 2px solid #333; }
  .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
</style></head><body>
  <h1>Factura #""" + f"{order.id:04d}" + """</h1>
  <div class="meta">Emitida: """ + date_str + """ | Estado: """ + status_labels.get(order.status, order.status) + """</div>
  <p style="font-size:14px"><strong>Cliente:</strong> """ + client_name + """<br><strong>Email:</strong> """ + client_email + """</p>
  <table><tr><th>Servicio</th><th>Descripción</th><th style="text-align:right">Importe</th></tr>
  <tr><td>""" + order.service + """</td><td>""" + (order.description or '—') + """</td><td style="text-align:right">""" + f"{order.amount:.2f}" + """€</td></tr>
  <tr class="total"><td colspan="2">Total</td><td style="text-align:right">""" + f"{order.amount:.2f}" + """€</td></tr>
  </table>
  <div class="footer">Vulnify &mdash; Ecosistemas Digitales con IA<br>""" + settings.SITE_URL + """</div>
</body></html>"""
    try:
        from weasyprint import HTML
        pdf = HTML(string=html).write_pdf()
        return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=invoice-{order_id:04d}.pdf"})
    except Exception as e:
        logger.exception("PDF generation error")
        return JSONResponse(status_code=500, content={"detail": f"Error generando PDF: {str(e)[:200]}"})
