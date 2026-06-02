import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi import Body
from database import get_db
from models.user import User
from models.plan import Plan
from modules.auth import get_current_user
from config import settings
from modules.activity_logger import log_activity

router = APIRouter(prefix="/api")
logger = logging.getLogger("vulnify.api.plans")


@router.get("/plans", description="List active subscription plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.active == True).order_by(Plan.price_monthly).all()
    return [{
        "id": p.id, "name": p.name, "description": p.description,
        "price_monthly": p.price_monthly, "price_yearly": p.price_yearly,
        "max_assets": p.max_assets, "features": p.features,
    } for p in plans]


@router.post("/subscribe", description="Create Stripe Checkout Session for subscription")
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
    from models.subscription import UserSubscription
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
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
    from models.subscription import UserSubscription
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if not sub:
        return {"subscribed": False}
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "subscribed": True, "status": sub.status,
        "plan": {"id": plan.id, "name": plan.name, "price_monthly": plan.price_monthly} if plan else None,
    }


@router.post("/stripe/webhook", description="Stripe webhook endpoint")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        return {"ok": True}
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        plan_id = int(session["metadata"]["plan_id"])
        from models.subscription import UserSubscription
        existing = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
        if existing:
            old_plan_id = existing.plan_id
            existing.plan_id = plan_id; existing.status = "active"
            existing.stripe_subscription_id = session.get("subscription")
        else:
            old_plan_id = None
            db.add(UserSubscription(user_id=user_id, plan_id=plan_id, status="active", stripe_subscription_id=session.get("subscription")))
        db.commit()
        plan_name = db.query(Plan.name).filter(Plan.id == plan_id).scalar()
        log_activity("subscription.completed", user_id, None, {"plan": plan_name, "stripe_session": session.get("id"), "old_plan_id": old_plan_id})
    elif event["type"] == "customer.subscription.updated":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == sub_data["id"]).first()
        if sub:
            old_status = sub.status
            sub.status = sub_data["status"]
            db.commit()
            log_activity("subscription.updated", sub.user_id, None, {"old_status": old_status, "new_status": sub_data["status"]})
    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        from models.subscription import UserSubscription
        sub = db.query(UserSubscription).filter(UserSubscription.stripe_subscription_id == sub_data["id"]).first()
        if sub:
            sub.status = "canceled"
            db.commit()
            log_activity("subscription.canceled", sub.user_id, None, {})
    return {"ok": True}
