from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False, index=True)
    steps = Column(Text, default="")
    impact = Column(Text, default="")
    status = Column(String, default="pending", index=True)
    reward = Column(Integer, default=0)
    attachment = Column(Text, default="")
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False, index=True)
    hunter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

    hunter = relationship("User", back_populates="reports")
    program = relationship("Program", back_populates="reports")
