import logging
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.message import Message
from models.user import User
from modules.auth import require_admin

router = APIRouter(prefix="/api/admin")
logger = logging.getLogger("vulnify.api.messages")


@router.get("/messages", description="List contact messages (admin only)")
def admin_list_messages(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
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
def admin_mark_read(
    message_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    msg.read = True
    db.commit()
    return {"ok": True}


@router.delete("/messages/{message_id}", description="Delete a message (admin only)")
def admin_delete_message(
    message_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    db.delete(msg)
    db.commit()
    return {"ok": True}
