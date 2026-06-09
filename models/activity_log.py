from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from database import Base, JSONColumn


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=True)
    action = Column(String, nullable=False, index=True)
    details = Column(JSONColumn, default={})
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
