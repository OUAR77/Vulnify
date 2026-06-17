import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.faq import FAQ
from models.user import User
from modules.auth import require_admin_totp
from config import limiter

router = APIRouter(prefix="/api/faqs", tags=["FAQs"])
logger = logging.getLogger("vulnify.api.faqs")


@router.get("/", description="List published FAQs")
@limiter.limit("30/minute")
def list_faqs(
    request: Request,
    db: Session = Depends(get_db),
):
    items = (
        db.query(FAQ)
        .filter(FAQ.published == True)
        .order_by(FAQ.order.asc())
        .all()
    )
    return [
        {
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category,
            "order": f.order,
            "published": f.published,
            "created_at": str(f.created_at)[:19],
        }
        for f in items
    ]


@router.post("/admin", description="Create a FAQ (admin only)")
@limiter.limit("10/minute")
def admin_create(
    request: Request,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    faq = FAQ(
        question=body.get("question", ""),
        answer=body.get("answer", ""),
        category=body.get("category", "General"),
        order=body.get("order", 0),
        published=body.get("published", True),
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return {"id": faq.id, "message": "FAQ creada"}


@router.put("/admin/{faq_id}", description="Update a FAQ (admin only)")
@limiter.limit("10/minute")
def admin_update(
    request: Request,
    faq_id: int,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ no encontrada")
    if "question" in body:
        faq.question = body["question"]
    if "answer" in body:
        faq.answer = body["answer"]
    if "category" in body:
        faq.category = body["category"]
    if "order" in body:
        faq.order = body["order"]
    if "published" in body:
        faq.published = body["published"]
    db.commit()
    db.refresh(faq)
    return {"id": faq.id, "message": "FAQ actualizada"}


@router.delete("/admin/{faq_id}", description="Delete a FAQ (admin only)")
@limiter.limit("10/minute")
def admin_delete(
    request: Request,
    faq_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ no encontrada")
    db.delete(faq)
    db.commit()
    return {"ok": True}


@router.put("/admin/reorder", description="Reorder FAQs (admin only)")
@limiter.limit("10/minute")
def admin_reorder(
    request: Request,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    for str_id, order in body.items():
        try:
            faq_id = int(str_id)
        except (ValueError, TypeError):
            continue
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if faq:
            faq.order = int(order)
    db.commit()
    return {"ok": True}
