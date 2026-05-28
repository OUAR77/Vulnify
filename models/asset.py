from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from database import Base


class MonitoredAsset(Base):
    __tablename__ = "monitored_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    value = Column(String, nullable=False)
    status = Column(String, default="active")
    last_checked = Column(DateTime, nullable=True)
    breaches_found = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
