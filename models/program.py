from datetime import date
from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base, JSONColumn


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    max_reward = Column(Integer, nullable=False)
    scope = Column(JSONColumn, default=[])
    out_of_scope = Column(JSONColumn, default=[])
    rules = Column(Text, default="")
    description = Column(Text, default="")
    tags = Column(JSONColumn, default=[])
    disclosure_date = Column(Date, nullable=True)
    status = Column(String, default="active", index=True)
    created_at = Column(DateTime, server_default=func.now())

    company = relationship("User", back_populates="programs")
    reports = relationship("Report", back_populates="program", cascade="all, delete-orphan")
