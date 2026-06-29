from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, func
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, default="")
    price_one_time = Column(Float, default=0)
    price_monthly = Column(Float, default=0)
    stripe_price_id_one_time = Column(String, nullable=True)
    stripe_price_id_monthly = Column(String, nullable=True)
    file_url = Column(String, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
