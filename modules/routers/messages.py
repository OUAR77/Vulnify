import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from database import get_db
from models.message import Message
from models.user import User
from modules.auth import require_admin_totp
from config import limiter

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.messages")


@router.get("/messages", description="List contact messages (admin only)")
@limiter.limit("30/minute")
def admin_list_messages(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    q = db.query(Message).order_by(Message.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "company": m.company,
                "subject": m.subject,
                "message": m.message,
                "read": m.read,
                "created_at": str(m.created_at)[:19],
            }
            for m in items
        ],
    }


@router.put("/messages/{message_id}/read", description="Mark message as read (admin only)")
@limiter.limit("30/minute")
def admin_mark_read(
    request: Request,
    message_id: int,
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    msg.read = True
    db.commit()
    return {"ok": True}


@router.delete("/messages/{message_id}", description="Delete a message (admin only)")
@limiter.limit("10/minute")
def admin_delete_message(
    request: Request,
    message_id: int,
    password: str | None = Query(None),
    admin: User = Depends(require_admin_totp),
    db: Session = Depends(get_db),
):
    from modules.auth import verify_password
    if not password or not verify_password(password, admin.password):
        raise HTTPException(status_code=403, detail="Contraseña incorrecta")
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    db.delete(msg)
    db.commit()
    return {"ok": True}
