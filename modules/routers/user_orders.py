import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
from models.order import Order
from modules.auth import get_current_user
from models.user import User

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
