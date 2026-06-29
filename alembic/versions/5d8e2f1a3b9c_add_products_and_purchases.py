"""Add products and purchases tables

Revision ID: 5d8e2f1a3b9c
Revises: f4cbe2729aef
Create Date: 2026-06-29 03:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '5d8e2f1a3b9c'
down_revision: Union[str, Sequence[str], None] = 'f4cbe2729aef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    if not conn.dialect.has_table(conn, "products"):
        op.create_table("products",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("price_one_time", sa.Float(), nullable=True),
            sa.Column("price_monthly", sa.Float(), nullable=True),
            sa.Column("stripe_price_id_one_time", sa.String(), nullable=True),
            sa.Column("stripe_price_id_monthly", sa.String(), nullable=True),
            sa.Column("file_url", sa.String(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )
        with op.batch_alter_table("products") as batch_op:
            batch_op.create_index("ix_products_id", ["id"])
            batch_op.create_index("ix_products_slug", ["slug"])

    if not conn.dialect.has_table(conn, "purchases"):
        op.create_table("purchases",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("buyer_email", sa.String(), nullable=False),
            sa.Column("buyer_name", sa.String(), nullable=True),
            sa.Column("amount", sa.Float(), nullable=True),
            sa.Column("interval", sa.String(), nullable=True),
            sa.Column("token", sa.String(), nullable=False),
            sa.Column("stripe_session_id", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("access_url", sa.Text(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token"),
        )
        with op.batch_alter_table("purchases") as batch_op:
            batch_op.create_index("ix_purchases_id", ["id"])
            batch_op.create_index("ix_purchases_token", ["token"])


def downgrade() -> None:
    op.drop_table("purchases")
    op.drop_table("products")
