from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    avatar = Column(String, default="")
    company = Column(String, default="")
    bio = Column(String, default="")
    is_verified = Column(Integer, default=0)
    stripe_customer_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
