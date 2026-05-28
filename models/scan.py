from sqlalchemy import Column, Integer, String, DateTime, Float, Text, func
from database import Base, JSONColumn


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    domain = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    issues_count = Column(Integer, default=0)
    ssl_valid = Column(Integer, default=0)
    ssl_days_left = Column(Integer, default=0)
    headers_score = Column(Float, default=0)
    result = Column(JSONColumn, default={})
    created_at = Column(DateTime, server_default=func.now())
