from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
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

    reports = relationship("Report", back_populates="hunter", cascade="all, delete-orphan")
    programs = relationship("Program", back_populates="company", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("CompanySubscription", back_populates="company", uselist=False, cascade="all, delete-orphan")
