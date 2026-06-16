import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Table, Text, UniqueConstraint
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
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    interests: Mapped[list["Interest"]] = relationship(
        "Interest", secondary=user_interests, back_populates="users", lazy="select"
    )

    threads: Mapped[list["Thread"]] = relationship("Thread", back_populates="author")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="author")
    likes: Mapped[list["Like"]] = relationship("Like", back_populates="user")


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
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    weak_signals_hashtags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weak_signals_music: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tags: Mapped[list["TrendTag"]] = relationship(
        "TrendTag",
        back_populates="trend",
        cascade="all, delete-orphan",
        lazy="select",
    )
    threads: Mapped[list["Thread"]] = relationship("Thread", back_populates="trend")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="trend")


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


# ── Community ──────────────────────────────────────────────────────────────────

class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    trend_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trends.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    author: Mapped["User"] = relationship("User", back_populates="threads")
    trend: Mapped["Trend | None"] = relationship("Trend", back_populates="threads")
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="thread", cascade="all, delete-orphan"
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="thread", cascade="all, delete-orphan"
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    thread_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("threads.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    trend_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trends.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    parent_comment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    author: Mapped["User"] = relationship("User", back_populates="comments")
    thread: Mapped["Thread | None"] = relationship("Thread", back_populates="comments")
    trend: Mapped["Trend | None"] = relationship("Trend", back_populates="comments")
    replies: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="parent_comment", cascade="all, delete-orphan"
    )
    parent_comment: Mapped["Comment | None"] = relationship(
        "Comment", back_populates="replies", remote_side=[id]
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="comment", cascade="all, delete-orphan"
    )


class FavoriteCollection(Base):
    __tablename__ = "favorite_collections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), nullable=False, default="🔖")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items: Mapped[list["FavoriteItem"]] = relationship("FavoriteItem", back_populates="collection", cascade="all, delete-orphan")


class FavoriteItem(Base):
    __tablename__ = "favorite_items"
    __table_args__ = (
        UniqueConstraint("collection_id", "thread_id", name="uq_favitem_col_thread"),
        UniqueConstraint("collection_id", "trend_id", name="uq_favitem_col_trend"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("favorite_collections.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("threads.id", ondelete="CASCADE"), nullable=True)
    trend_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trends.id", ondelete="CASCADE"), nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    collection: Mapped["FavoriteCollection"] = relationship("FavoriteCollection", back_populates="items")
    thread: Mapped["Thread | None"] = relationship("Thread")
    trend: Mapped["Trend | None"] = relationship("Trend")


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "thread_id", name="uq_like_user_thread"),
        UniqueConstraint("user_id", "comment_id", name="uq_like_user_comment"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    thread_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("threads.id", ondelete="CASCADE"),
        nullable=True,
    )
    comment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="likes")
    thread: Mapped["Thread | None"] = relationship("Thread", back_populates="likes")
    comment: Mapped["Comment | None"] = relationship("Comment", back_populates="likes")
