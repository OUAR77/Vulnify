from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from database import Base


class OrderPhoto(Base):
    __tablename__ = "order_photos"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    image_data = Column(Text, nullable=False)
    caption = Column(String, default="")
    created_at = Column(DateTime, server_default=func.now())
