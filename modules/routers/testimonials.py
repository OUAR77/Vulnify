import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.testimonial import Testimonial
from models.user import User
from modules.auth import require_admin_totp
from config import limiter

router = APIRouter(prefix="/api/testimonials", tags=["Testimonials"])
logger = logging.getLogger("vulnify.api.testimonials")


@router.get("/", description="List featured testimonials")
@limiter.limit("30/minute")
def list_featured(
    request: Request,
    db: Session = Depends(get_db),
):
    items = (
        db.query(Testimonial)
        .filter(Testimonial.featured == True)
        .order_by(Testimonial.created_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "name": t.name,
            "role": t.role,
            "company": t.company,
            "content": t.content,
            "avatar_url": t.avatar_url,
            "rating": t.rating,
            "featured": t.featured,
            "created_at": str(t.created_at)[:19],
        }
        for t in items
    ]


@router.get("/all", description="List all testimonials")
@limiter.limit("30/minute")
def list_all(
    request: Request,
    db: Session = Depends(get_db),
):
    items = db.query(Testimonial).order_by(Testimonial.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "role": t.role,
            "company": t.company,
            "content": t.content,
            "avatar_url": t.avatar_url,
            "rating": t.rating,
            "featured": t.featured,
            "created_at": str(t.created_at)[:19],
        }
        for t in items
    ]


@router.post("/admin", description="Create a testimonial (admin only)")
@limiter.limit("10/minute")
def admin_create(
    request: Request,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    testimonial = Testimonial(
        name=body.get("name", ""),
        role=body.get("role", ""),
        company=body.get("company", ""),
        content=body.get("content", ""),
        avatar_url=body.get("avatar_url", ""),
        rating=body.get("rating", 5),
        featured=body.get("featured", False),
    )
    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)
    return {"id": testimonial.id, "message": "Testimonial creado"}


@router.put("/admin/{testimonial_id}", description="Update a testimonial (admin only)")
@limiter.limit("10/minute")
def admin_update(
    request: Request,
    testimonial_id: int,
    body: dict,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    t = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Testimonial no encontrado")
    if "name" in body:
        t.name = body["name"]
    if "role" in body:
        t.role = body["role"]
    if "company" in body:
        t.company = body["company"]
    if "content" in body:
        t.content = body["content"]
    if "avatar_url" in body:
        t.avatar_url = body["avatar_url"]
    if "rating" in body:
        t.rating = body["rating"]
    if "featured" in body:
        t.featured = body["featured"]
    db.commit()
    db.refresh(t)
    return {"id": t.id, "message": "Testimonial actualizado"}


@router.delete("/admin/{testimonial_id}", description="Delete a testimonial (admin only)")
@limiter.limit("10/minute")
def admin_delete(
    request: Request,
    testimonial_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    t = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Testimonial no encontrado")
    db.delete(t)
    db.commit()
    return {"ok": True}
