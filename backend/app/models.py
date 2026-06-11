import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, PyEnum):
    COMMUNITY_MANAGER = "community_manager"
    AGENCE            = "agence"
    INFLUENCEUR       = "influenceur"
    CONTENT_CREATOR   = "content_creator"
    PARENT            = "parent"
    TEACHER           = "teacher"
    AUTRE             = "autre"


class TrendStatus(str, PyEnum):
    VIRAL     = "viral"
    EMERGENT  = "emergent"
    EN_HAUSSE = "en_hausse"
    STABLE    = "stable"
    EN_BAISSE = "en_baisse"


class TagType(str, PyEnum):
    INTEREST   = "interest"    # ex: "mode", "tech", "food"
    GENERATION = "generation"  # ex: "18-24", "25-34", "35-44"
    ROLE       = "role"        # ex: "community_manager", "influenceur"


# ── Association Table (Many-to-Many) ──────────────────────────────────────────

user_interests = Table(
    "user_interests",
    Base.metadata,
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "interest_id",
        Integer,
        ForeignKey("interests.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ── ORM Models ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(254), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    plan: Mapped[str] = mapped_column(String(20), nullable=False, server_default="standard")

    role: Mapped[UserRole | None] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=True
    )

    # Audience cible — listes stockées en JSON
    # Valeurs attendues : "13-17", "18-24", "25-34", "35-44", "45-65", "65-plus"
    target_ages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # ex: ["tiktok", "instagram", "youtube"]
    target_networks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # ex: ["france", "europe"]
    target_geography: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # ex: "homme", "femme", "tous", "autre"
    target_gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    interests: Mapped[list["Interest"]] = relationship(
        "Interest", secondary=user_interests, back_populates="users", lazy="select"
    )


class Interest(Base):
    __tablename__ = "interests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )

    users: Mapped[list["User"]] = relationship(
        "User", secondary=user_interests, back_populates="interests"
    )


class Trend(Base):
    __tablename__ = "trends"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str] = mapped_column(Text, nullable=False)
    usage_example: Mapped[str] = mapped_column(Text, nullable=False)
    usage_keys: Mapped[list | None] = mapped_column(JSON, nullable=True)
    score_base: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[TrendStatus] = mapped_column(
        Enum(TrendStatus, name="trend_status"), nullable=False
    )
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    age_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    platforms: Mapped[list | None] = mapped_column(JSON, nullable=True)
    badges: Mapped[list | None] = mapped_column(JSON, nullable=True)
    extra_stats: Mapped[list | None] = mapped_column(JSON, nullable=True)
    rank: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tags: Mapped[list["TrendTag"]] = relationship(
        "TrendTag",
        back_populates="trend",
        cascade="all, delete-orphan",
        lazy="select",
    )


class TrendTag(Base):
    """
    Relie une tendance à un critère de matching.

    Exemples :
      (trend_id=X, INTEREST,   "mode")
      (trend_id=X, GENERATION, "18-24")
      (trend_id=X, ROLE,       "community_manager")
    """
    __tablename__ = "trend_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trend_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trends.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_type: Mapped[TagType] = mapped_column(
        Enum(TagType, name="tag_type"), nullable=False
    )
    value: Mapped[str] = mapped_column(String(100), nullable=False)

    trend: Mapped["Trend"] = relationship("Trend", back_populates="tags")
