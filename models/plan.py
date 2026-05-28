from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, func
from database import Base, JSONColumn


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float, nullable=True)
    stripe_price_id_monthly = Column(String, nullable=True)
    stripe_price_id_yearly = Column(String, nullable=True)
    max_assets = Column(Integer, default=0)
    max_reports = Column(Integer, default=0)
    max_programs = Column(Integer, default=0)
    features = Column(JSONColumn, default=[])
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
