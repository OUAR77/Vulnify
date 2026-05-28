from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
