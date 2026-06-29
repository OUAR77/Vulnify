from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text
from database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_email = Column(String, nullable=False)
    buyer_name = Column(String, default="")
    amount = Column(Float, default=0)
    interval = Column(String, default="one_time")
    token = Column(String, unique=True, index=True, nullable=False)
    stripe_session_id = Column(String, nullable=True)
    status = Column(String, default="pending")
    access_url = Column(Text, default="")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
