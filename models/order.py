from sqlalchemy import Column, Integer, String, Text, Float, DateTime, func, ForeignKey
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    description = Column(Text, default="")
    service = Column(String, nullable=False)
    amount = Column(Float, default=0)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, server_default=func.now())
