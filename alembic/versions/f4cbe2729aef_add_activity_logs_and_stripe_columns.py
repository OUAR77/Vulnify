"""Add activity_logs table, stripe columns to plans, and remaining tables

Revision ID: f4cbe2729aef
Revises: 36a8069d5f9b
Create Date: 2026-05-28 16:52:04.560899

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f4cbe2729aef'
down_revision: Union[str, Sequence[str], None] = '36a8069d5f9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # --- users ---
    if not conn.dialect.has_table(conn, "users"):
        op.create_table("users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("password", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("role", sa.String(), nullable=False),
            sa.Column("avatar", sa.String(), nullable=True),
            sa.Column("company", sa.String(), nullable=True),
            sa.Column("bio", sa.String(), nullable=True),
            sa.Column("is_verified", sa.Integer(), nullable=True),
            sa.Column("stripe_customer_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("email"),
        )
        with op.batch_alter_table("users") as batch_op:
            batch_op.create_index("ix_users_email", ["email"])
            batch_op.create_index("ix_users_id", ["id"])

    # --- plans ---
    if not conn.dialect.has_table(conn, "plans"):
        op.create_table("plans",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("price_monthly", sa.Float(), nullable=False),
            sa.Column("price_yearly", sa.Float(), nullable=True),
            sa.Column("stripe_price_id_monthly", sa.String(), nullable=True),
            sa.Column("stripe_price_id_yearly", sa.String(), nullable=True),
            sa.Column("max_reports", sa.Integer(), nullable=True),
            sa.Column("max_programs", sa.Integer(), nullable=True),
            sa.Column("features", sa.Text(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("plans") as batch_op:
            batch_op.create_index("ix_plans_id", ["id"])
    else:
        # add stripe columns if missing
        for col, coltype in [("stripe_price_id_monthly", sa.String), ("stripe_price_id_yearly", sa.String)]:
            try:
                with op.batch_alter_table("plans") as batch_op:
                    batch_op.add_column(sa.Column(col, coltype(), nullable=True))
            except Exception:
                pass

    # --- monitored_assets ---
    if not conn.dialect.has_table(conn, "monitored_assets"):
        op.create_table("monitored_assets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("type", sa.String(), nullable=False),
            sa.Column("value", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("last_checked", sa.DateTime(), nullable=True),
            sa.Column("breaches_found", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("monitored_assets") as batch_op:
            batch_op.create_index("ix_monitored_assets_id", ["id"])
            batch_op.create_index("ix_monitored_assets_user_id", ["user_id"])

    # --- breach_alerts ---
    if not conn.dialect.has_table(conn, "breach_alerts"):
        op.create_table("breach_alerts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("asset_id", sa.Integer(), nullable=True),
            sa.Column("breach_name", sa.String(), nullable=False),
            sa.Column("breach_date", sa.String(), nullable=True),
            sa.Column("data_classes", sa.Text(), nullable=True),
            sa.Column("severity", sa.String(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("read", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["asset_id"], ["monitored_assets.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("breach_alerts") as batch_op:
            batch_op.create_index("ix_breach_alerts_id", ["id"])
            batch_op.create_index("ix_breach_alerts_user_id", ["user_id"])

    # --- user_subscriptions ---
    if not conn.dialect.has_table(conn, "user_subscriptions"):
        op.create_table("user_subscriptions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("plan_id", sa.Integer(), nullable=False),
            sa.Column("stripe_subscription_id", sa.String(), nullable=True),
            sa.Column("stripe_customer_id", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("current_period_start", sa.DateTime(), nullable=True),
            sa.Column("current_period_end", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("user_subscriptions") as batch_op:
            batch_op.create_index("ix_user_subscriptions_id", ["id"])
            batch_op.create_index("ix_user_subscriptions_user_id", ["user_id"])

    # --- activity_logs ---
    if not conn.dialect.has_table(conn, "activity_logs"):
        op.create_table("activity_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("email", sa.String(), nullable=True),
            sa.Column("action", sa.String(), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        with op.batch_alter_table("activity_logs") as batch_op:
            batch_op.create_index("ix_activity_logs_id", ["id"])
            batch_op.create_index("ix_activity_logs_action", ["action"])
            batch_op.create_index("ix_activity_logs_created_at", ["created_at"])


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_table("user_subscriptions")
    op.drop_table("breach_alerts")
    op.drop_table("monitored_assets")
    op.drop_table("plans")
    op.drop_table("users")
