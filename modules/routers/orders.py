import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.order import Order
from models.order_photo import OrderPhoto
from models.user import User
from modules.auth import require_admin_totp, verify_password
from config import limiter

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
    if data.amount is not None:
        order.amount = data.amount
    if data.status is not None:
        order.status = data.status
    db.commit()
    return {"ok": True}


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


class PhotoUpload(BaseModel):
    image_data: str
    caption: str = ""


@router.post("/orders/{order_id}/photos", description="Upload a progress photo (admin only)")
def admin_upload_photo(
    order_id: int,
    body: PhotoUpload,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    photo = OrderPhoto(order_id=order_id, image_data=body.image_data, caption=body.caption)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return {"id": photo.id, "caption": photo.caption, "created_at": str(photo.created_at)[:19]}


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
