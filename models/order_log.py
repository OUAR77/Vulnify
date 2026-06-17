from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from database import Base


class OrderLog(Base):
    __tablename__ = "order_logs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    field = Column(String, nullable=False)
    old_value = Column(Text, default="")
    new_value = Column(Text, default="")
    changed_by = Column(String, default="")
    created_at = Column(DateTime, server_default=func.now())
