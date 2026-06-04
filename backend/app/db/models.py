"""SQLAlchemy ORM models — the source of truth that Alembic migrates from.

3NF design notes (full proof in BRONZE_DB.md):
- All tables have a single-column primary key (UUID stored as CHAR(36)).
- No repeating groups (1NF).
- Every non-key attribute depends on the whole key, not a part of it (2NF).
- No transitive dependencies — e.g. Offer no longer carries idea_title because
  that is functionally dependent on idea_id, not on offer_id (3NF).
"""
from datetime import date
import uuid
import enum

from sqlalchemy import (
    Column, String, Integer, Float, Date, ForeignKey, Index, Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _today() -> date:
    return date.today()


# ── Enum types ───────────────────────────────────────────────────────────────


class IndustryEnum(str, enum.Enum):
    HealthTech = "HealthTech"
    FinTech = "FinTech"
    EdTech = "EdTech"
    AI = "AI"
    SaaS = "SaaS"
    ECommerce = "E-commerce"
    Other = "Other"


class StageEnum(str, enum.Enum):
    Idea = "Idea"
    MVP = "MVP"
    Growth = "Growth"
    Scale = "Scale"


class UserRoleEnum(str, enum.Enum):
    Admin = "Admin"
    StartupOwner = "StartupOwner"
    Investor = "Investor"


class OfferStatusEnum(str, enum.Enum):
    Pending = "Pending"
    Accepted = "Accepted"
    Rejected = "Rejected"


class MilestoneStatusEnum(str, enum.Enum):
    Pending = "Pending"
    InProgress = "InProgress"
    Done = "Done"


# ── Tables ───────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRoleEnum, native_enum=False, length=32), nullable=False)

    __table_args__ = (
        Index("ix_users_email_lower", "email"),
    )


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(200), nullable=False)
    industry = Column(SAEnum(IndustryEnum, native_enum=False, length=32), nullable=False)
    stage = Column(SAEnum(StageEnum, native_enum=False, length=32), nullable=False)
    description = Column(String(2000), nullable=False)
    created_by = Column(String(100), nullable=False)
    created_at = Column(Date, nullable=False, default=_today)

    offers = relationship("Offer", back_populates="idea", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="idea", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="idea", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_ideas_industry", "industry"),
        Index("ix_ideas_stage", "stage"),
    )


class Offer(Base):
    __tablename__ = "offers"

    id = Column(String(36), primary_key=True, default=_uuid)
    idea_id = Column(String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    investor_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    equity = Column(Float, nullable=False)
    message = Column(String(1000), nullable=False)
    status = Column(
        SAEnum(OfferStatusEnum, native_enum=False, length=16),
        nullable=False,
        default=OfferStatusEnum.Pending,
    )
    created_at = Column(Date, nullable=False, default=_today)

    idea = relationship("Idea", back_populates="offers")

    __table_args__ = (
        Index("ix_offers_idea_id", "idea_id"),
        Index("ix_offers_status", "status"),
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=_uuid)
    idea_id = Column(String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    user = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String(500), nullable=False)
    created_at = Column(Date, nullable=False, default=_today)

    idea = relationship("Idea", back_populates="feedback")

    __table_args__ = (
        Index("ix_feedback_idea_id", "idea_id"),
    )


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String(36), primary_key=True, default=_uuid)
    idea_id = Column(String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False, default="")
    status = Column(
        SAEnum(MilestoneStatusEnum, native_enum=False, length=16),
        nullable=False,
        default=MilestoneStatusEnum.Pending,
    )
    due_date = Column(Date, nullable=True)
    created_at = Column(Date, nullable=False, default=_today)

    idea = relationship("Idea", back_populates="milestones")

    __table_args__ = (
        Index("ix_milestones_idea_id", "idea_id"),
    )


class OfferStatusAudit(Base):
    """Trigger-populated audit table for offer status transitions."""
    __tablename__ = "offer_status_audit"

    id = Column(Integer, primary_key=True, autoincrement=True)
    offer_id = Column(String(36), nullable=False)
    old_status = Column(String(16), nullable=False)
    new_status = Column(String(16), nullable=False)
    changed_at = Column(Date, nullable=False, default=_today)

    __table_args__ = (
        Index("ix_audit_offer_id", "offer_id"),
    )
