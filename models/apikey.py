from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    key = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
