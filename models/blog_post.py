from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from database import Base

class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    tag = Column(String, default="General")
    excerpt = Column(Text, default="")
    content = Column(Text, default="")
    author = Column(String, default="Vulnify")
    read_time = Column(String, default="5 min")
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
