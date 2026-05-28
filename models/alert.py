from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, func
from database import Base, JSONColumn


class BreachAlert(Base):
    __tablename__ = "breach_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("monitored_assets.id"), nullable=True)
    breach_name = Column(String, nullable=False)
    breach_date = Column(String, nullable=True)
    data_classes = Column(JSONColumn, default=[])
    severity = Column(String, default="medium")
    description = Column(Text, default="")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
