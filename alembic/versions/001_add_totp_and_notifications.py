"""Add TOTP and notification columns

Revision ID: 001
Revises: None
Create Date: 2026-06-02
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("totp_secret", sa.String(), nullable=True))
    op.add_column("users", sa.Column("totp_enabled", sa.Boolean(), default=False))
    op.add_column("users", sa.Column("notify_critical", sa.Boolean(), default=True))
    op.add_column("users", sa.Column("notify_high", sa.Boolean(), default=True))
    op.add_column("users", sa.Column("notify_medium", sa.Boolean(), default=True))
    op.add_column("users", sa.Column("notify_low", sa.Boolean(), default=False))
    op.add_column("users", sa.Column("notify_email", sa.Boolean(), default=True))
    op.add_column("users", sa.Column("dark_mode", sa.Boolean(), default=False))


def downgrade() -> None:
    op.drop_column("users", "totp_secret")
    op.drop_column("users", "totp_enabled")
    op.drop_column("users", "notify_critical")
    op.drop_column("users", "notify_high")
    op.drop_column("users", "notify_medium")
    op.drop_column("users", "notify_low")
    op.drop_column("users", "notify_email")
    op.drop_column("users", "dark_mode")
