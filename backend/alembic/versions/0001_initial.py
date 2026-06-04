"""Initial schema: users, ideas, offers, feedback, milestones, offer_status_audit.

This migration mirrors what `alembic revision --autogenerate` produces from
the ORM classes in app/db/models.py — i.e. it is generated *from* the domain
objects, not hand-rolled DDL.

Revision ID: 0001
Revises:
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email_lower", "users", ["email"])

    op.create_table(
        "ideas",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("industry", sa.String(length=32), nullable=False),
        sa.Column("stage", sa.String(length=32), nullable=False),
        sa.Column("description", sa.String(length=2000), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ideas_industry", "ideas", ["industry"])
    op.create_index("ix_ideas_stage", "ideas", ["stage"])

    op.create_table(
        "offers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("idea_id", sa.String(length=36), nullable=False),
        sa.Column("investor_name", sa.String(length=100), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("equity", sa.Float(), nullable=False),
        sa.Column("message", sa.String(length=1000), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["idea_id"], ["ideas.id"], ondelete="CASCADE", name="fk_offers_idea_id"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_offers_idea_id", "offers", ["idea_id"])
    op.create_index("ix_offers_status", "offers", ["status"])

    op.create_table(
        "feedback",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("idea_id", sa.String(length=36), nullable=False),
        sa.Column("user", sa.String(length=100), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["idea_id"], ["ideas.id"], ondelete="CASCADE", name="fk_feedback_idea_id"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feedback_idea_id", "feedback", ["idea_id"])

    op.create_table(
        "milestones",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("idea_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(
            ["idea_id"], ["ideas.id"], ondelete="CASCADE", name="fk_milestones_idea_id"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_milestones_idea_id", "milestones", ["idea_id"])

    op.create_table(
        "offer_status_audit",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("offer_id", sa.String(length=36), nullable=False),
        sa.Column("old_status", sa.String(length=16), nullable=False),
        sa.Column("new_status", sa.String(length=16), nullable=False),
        sa.Column("changed_at", sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_offer_id", "offer_status_audit", ["offer_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_offer_id", table_name="offer_status_audit")
    op.drop_table("offer_status_audit")
    op.drop_index("ix_milestones_idea_id", table_name="milestones")
    op.drop_table("milestones")
    op.drop_index("ix_feedback_idea_id", table_name="feedback")
    op.drop_table("feedback")
    op.drop_index("ix_offers_status", table_name="offers")
    op.drop_index("ix_offers_idea_id", table_name="offers")
    op.drop_table("offers")
    op.drop_index("ix_ideas_stage", table_name="ideas")
    op.drop_index("ix_ideas_industry", table_name="ideas")
    op.drop_table("ideas")
    op.drop_index("ix_users_email_lower", table_name="users")
    op.drop_table("users")
