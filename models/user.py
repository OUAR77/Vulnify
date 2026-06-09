from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from database import Base, JSONColumn


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    avatar = Column(String, default="")
    company = Column(String, default="")
    bio = Column(String, default="")
    is_verified = Column(Integer, default=0)
    stripe_customer_id = Column(String, nullable=True)
    totp_secret = Column(String, nullable=True)
    totp_enabled = Column(Boolean, default=False)
    notify_critical = Column(Boolean, default=True)
    notify_high = Column(Boolean, default=True)
    notify_medium = Column(Boolean, default=True)
    notify_low = Column(Boolean, default=False)
    notify_email = Column(Boolean, default=True)
    dark_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
