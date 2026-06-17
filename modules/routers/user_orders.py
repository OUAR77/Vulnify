import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from database import get_db
from models.order import Order
from models.order_photo import OrderPhoto
from models.order_log import OrderLog
from models.user import User
from modules.auth import get_current_user
from config import settings

logger = logging.getLogger("vulnify.orders")
router = APIRouter(tags=["orders"])


@router.get("/api/orders", description="List current user's orders")
def list_my_orders(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return {"total": total, "page": page, "per_page": per_page, "items": items}


@router.post("/api/orders", description="Create a new order")
def create_order(
    request: Request,
    body: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = Order(
        user_id=user.id,
        client_name=user.name,
        client_email=user.email,
        description=body.get("description", ""),
        service=body.get("service", ""),
        amount=body.get("amount", 0),
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"id": order.id, "status": order.status, "message": "Pedido creado"}


@router.get("/api/orders/{order_id}/photos", description="Get progress photos for an order")
def get_order_photos(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
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


@router.get("/api/orders/{order_id}/timeline", description="Get timeline for an order")
def get_order_timeline(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    logs = db.query(OrderLog).filter(OrderLog.order_id == order_id).order_by(OrderLog.created_at.asc()).all()
    return [
        {"id": l.id, "field": l.field, "old_value": l.old_value, "new_value": l.new_value, "changed_by": l.changed_by, "created_at": str(l.created_at)[:19]}
        for l in logs
    ]


@router.get("/api/orders/{order_id}/invoice", description="Download PDF invoice for an order")
def get_order_invoice(
    order_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    date_str = str(order.created_at)[:10] if order.created_at else ""
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
  <p style="font-size:14px"><strong>Cliente:</strong> """ + user.name + """<br><strong>Email:</strong> """ + user.email + """</p>
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
