import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models.product import Product
from models.purchase import Purchase
from models.user import User
from modules.auth import get_current_user, require_admin
from config import settings

router = APIRouter()
logger = logging.getLogger("vulnify.api.products")


# --- PUBLIC ---

@router.get("/api/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.active == True).order_by(Product.id).all()
    return [{
        "id": p.id, "name": p.name, "slug": p.slug,
        "description": p.description,
        "price_one_time": p.price_one_time,
        "price_monthly": p.price_monthly,
        "active": p.active,
    } for p in products]


@router.get("/api/products/{slug}")
def get_product(slug: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.slug == slug, Product.active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {
        "id": p.id, "name": p.name, "slug": p.slug,
        "description": p.description,
        "price_one_time": p.price_one_time,
        "price_monthly": p.price_monthly,
    }


@router.post("/api/products/checkout")
def product_checkout(
    request: Request,
    product_id: int = Body(...),
    interval: str = Body("one_time"),
    buyer_email: str = Body(...),
    buyer_name: str = Body(""),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    price = product.price_one_time if interval == "one_time" else product.price_monthly
    if not price or price <= 0:
        raise HTTPException(status_code=400, detail="Precio no configurado para esta modalidad")

    if not settings.STRIPE_SECRET_KEY:
        token = create_purchase_token(product, buyer_email, buyer_name, price, interval, db)
        return {"checkout_url": None, "token": token, "free": True}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    price_id = product.stripe_price_id_one_time if interval == "one_time" else product.stripe_price_id_monthly
    if not price_id:
        raise HTTPException(status_code=400, detail="Producto sin precio en Stripe")

    try:
        session = stripe.checkout.Session.create(
            mode="payment" if interval == "one_time" else "subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            customer_email=buyer_email,
            success_url=settings.SITE_URL + f"/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=settings.SITE_URL + f"/productos/{product.slug}?canceled=1",
            metadata={
                "product_id": str(product.id),
                "interval": interval,
                "buyer_email": buyer_email,
                "buyer_name": buyer_name,
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")


@router.get("/api/products/access/{token}")
def access_product(token: str, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(
        Purchase.token == token,
        Purchase.status == "completed",
    ).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Token inválido o compra no completada")
    if purchase.expires_at and purchase.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="El acceso ha expirado")
    product = db.query(Product).filter(Product.id == purchase.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.file_url:
        return RedirectResponse(url=product.file_url)
    return {"product_name": product.name, "token": token, "purchased_at": str(purchase.created_at)}


# --- STRIPE WEBHOOK ---

@router.post("/api/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not settings.STRIPE_WEBHOOK_SECRET or not sig_header:
        return {"ok": True}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        product_id = metadata.get("product_id")
        interval = metadata.get("interval", "one_time")
        buyer_email = metadata.get("buyer_email", session.get("customer_email", ""))
        buyer_name = metadata.get("buyer_name", "")

        if product_id:
            product = db.query(Product).filter(Product.id == int(product_id)).first()
            if product:
                amount = session.get("amount_total", 0) / 100
                token = secrets.token_urlsafe(32)
                purchase = Purchase(
                    product_id=int(product_id),
                    buyer_email=buyer_email,
                    buyer_name=buyer_name,
                    amount=amount,
                    interval=interval,
                    token=token,
                    stripe_session_id=session.get("id"),
                    status="completed",
                )
                if interval != "one_time":
                    purchase.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
                db.add(purchase)
                db.commit()

    return {"ok": True}


@router.get("/api/stripe/check-session/{session_id}")
def check_stripe_session(session_id: str, db: Session = Depends(get_db)):
    if not settings.STRIPE_SECRET_KEY:
        return {"ok": False}
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.get("payment_status") == "paid":
            return {"ok": True}
        return {"ok": False}
    except Exception:
        return {"ok": False}


# --- ADMIN ---

@router.get("/api/admin/products")
def admin_list_products(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.id).all()
    return [{
        "id": p.id, "name": p.name, "slug": p.slug,
        "description": p.description,
        "price_one_time": p.price_one_time,
        "price_monthly": p.price_monthly,
        "stripe_price_id_one_time": p.stripe_price_id_one_time,
        "stripe_price_id_monthly": p.stripe_price_id_monthly,
        "file_url": p.file_url,
        "active": p.active,
        "created_at": str(p.created_at)[:19],
    } for p in products]


@router.post("/api/admin/products")
def admin_create_product(data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    product = Product(
        name=data["name"],
        slug=data.get("slug", ""),
        description=data.get("description", ""),
        price_one_time=data.get("price_one_time"),
        price_monthly=data.get("price_monthly"),
        stripe_price_id_one_time=data.get("stripe_price_id_one_time", ""),
        stripe_price_id_monthly=data.get("stripe_price_id_monthly", ""),
        file_url=data.get("file_url", ""),
        active=data.get("active", True),
    )
    if not product.slug:
        product.slug = re.sub(r'[^a-z0-9-]', '', product.name.lower().replace(" ", "-"))
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"ok": True, "id": product.id}


@router.put("/api/admin/products/{product_id}")
def admin_update_product(product_id: int, data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field in ("name", "slug", "description", "price_one_time", "price_monthly",
                  "stripe_price_id_one_time", "stripe_price_id_monthly", "file_url", "active"):
        if field in data:
            setattr(product, field, data[field])
    db.commit()
    return {"ok": True}


@router.delete("/api/admin/products/{product_id}")
def admin_delete_product(product_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.query(Purchase).filter(Purchase.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return {"ok": True}


@router.get("/api/admin/purchases")
def admin_list_purchases(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    purchases = db.query(Purchase).order_by(Purchase.created_at.desc()).limit(100).all()
    return [{
        "id": p.id,
        "product_id": p.product_id,
        "buyer_email": p.buyer_email,
        "buyer_name": p.buyer_name,
        "amount": p.amount,
        "interval": p.interval,
        "token": p.token,
        "status": p.status,
        "created_at": str(p.created_at)[:19],
        "expires_at": str(p.expires_at)[:19] if p.expires_at else None,
    } for p in purchases]


@router.post("/api/admin/purchases/{purchase_id}/regenerate-token")
def admin_regenerate_token(purchase_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    purchase.token = secrets.token_urlsafe(32)
    db.commit()
    return {"ok": True, "token": purchase.token}


def create_purchase_token(product: Product, email: str, name: str, amount: float, interval: str, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    purchase = Purchase(
        product_id=product.id,
        buyer_email=email,
        buyer_name=name,
        amount=amount,
        interval=interval,
        token=token,
        status="completed",
    )
    if interval != "one_time":
        purchase.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.add(purchase)
    db.commit()
    return token
