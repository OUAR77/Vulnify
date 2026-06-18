import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi import Body
from sqlalchemy import text
from database import get_db
from models.plan import Plan
from models.user import User
from modules.auth import get_current_user
from config import settings
from modules.activity_logger import log_activity

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.plans")


@router.get("/plans", description="List active plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.active == True).order_by(Plan.price_monthly).all()
    return [{
        "id": p.id, "name": p.name, "description": p.description,
        "price_monthly": p.price_monthly, "price_yearly": p.price_yearly,
        "features": p.features,
    } for p in plans]


@router.post("/subscribe", description="Create Stripe Checkout Session")
def subscribe(
    request: Request, plan_id: int = Body(...),
    interval: str = Body("month"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    price = plan.price_monthly if interval == "month" else (plan.price_yearly or plan.price_monthly)
    if price == 0:
        return {"checkout_url": None, "free": True}
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe no configurado")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    price_id = plan.stripe_price_id_monthly if interval == "month" else (plan.stripe_price_id_yearly or plan.stripe_price_id_monthly)
    if not price_id:
        raise HTTPException(status_code=400, detail="Plan sin precio en Stripe")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=str(user.id), customer_email=user.email,
            success_url=request.base_url._url.rstrip("/") + "/dashboard?success=1",
            cancel_url=request.base_url._url.rstrip("/") + "/pricing?canceled=1",
            metadata={"plan_id": str(plan.id), "user_id": str(user.id)},
        )
        log_activity("subscription.checkout", user.id, user.email, {"plan": plan.name, "interval": interval, "session_id": session.id})
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")


@router.get("/subscription", description="Get current subscription status")
def get_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"subscribed": False}


@router.post("/stripe/webhook", description="Stripe webhook endpoint")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return {"ok": True}
    return {"ok": True}
