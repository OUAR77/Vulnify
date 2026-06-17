from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from database import Base

class FAQ(Base):
    __tablename__ = "faqs"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String, default="General")
    order = Column(Integer, default=0)
    published = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
