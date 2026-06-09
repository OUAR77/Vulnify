from typing import Optional
from database import SessionLocal
from models.activity_log import ActivityLog


def log_activity(
    action: str,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    try:
        db = SessionLocal()
        entry = ActivityLog(
            user_id=user_id,
            email=email,
            action=action,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(entry)
        db.commit()
        db.close()
    except Exception:
        pass


def get_client_ip(request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
