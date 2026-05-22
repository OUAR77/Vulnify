from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from database import Base


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hunter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    commission_percentage = Column(Float, default=10.0)
    commission_amount = Column(Float, nullable=False)
    hunter_amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    stripe_transfer_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
