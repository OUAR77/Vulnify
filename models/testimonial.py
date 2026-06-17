from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from database import Base

class Testimonial(Base):
    __tablename__ = "testimonials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="")
    company = Column(String, default="")
    content = Column(Text, nullable=False)
    avatar_url = Column(String, default="")
    rating = Column(Integer, default=5)
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
