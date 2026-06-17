import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.comments.service import get_comments, post_comment
from app.models import Comment, Like, Thread, Trend
from app.schemas import (
    CommentAuthor,
    CommentCreate,
    CommentListResponse,
    CommentResponse,
    ThreadCreate,
    ThreadDetailResponse,
    ThreadListResponse,
    ThreadResponse,
    ThreadTrendSnippet,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _trend_snippet(trend: Trend | None) -> ThreadTrendSnippet | None:
    if not trend:
        return None
    return ThreadTrendSnippet(
        id=trend.id,
        title=trend.title,
        image_url=trend.image_url,
        status=trend.status,
    )


def _thread_response(
    thread: Thread,
    like_count: int,
    comment_count: int,
    is_liked: bool = False,
) -> ThreadResponse:
    return ThreadResponse(
        id=thread.id,
        author=CommentAuthor(id=thread.author.id, username=thread.author.username, avatar_url=thread.author.avatar_url),
        trend=_trend_snippet(thread.trend),
        title=thread.title,
        body=thread.body,
        is_pinned=thread.is_pinned,
        is_locked=thread.is_locked,
        comment_count=comment_count,
        like_count=like_count,
        is_liked=is_liked,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


# ── CRUD ──────────────────────────────────────────────────────────────────────

def get_threads(
    db: Session,
    *,
    trend_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 20,
) -> ThreadListResponse:
    q = (
        db.query(Thread)
        .options(selectinload(Thread.author), selectinload(Thread.trend))
    )
    if trend_id:
        q = q.filter(Thread.trend_id == trend_id)

    total: int = q.count()
    threads: list[Thread] = (
        q.order_by(Thread.is_pinned.desc(), Thread.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    if not threads:
        return ThreadListResponse(total=total, items=[], skip=skip, limit=limit)

    thread_ids = [t.id for t in threads]

    like_counts: dict[uuid.UUID, int] = dict(
        db.query(Like.thread_id, func.count(Like.id))
        .filter(Like.thread_id.in_(thread_ids))
        .group_by(Like.thread_id)
        .all()
    )
    comment_counts: dict[uuid.UUID, int] = dict(
        db.query(Comment.thread_id, func.count(Comment.id))
        .filter(Comment.thread_id.in_(thread_ids), Comment.is_deleted.is_(False))
        .group_by(Comment.thread_id)
        .all()
    )

    items = [
        _thread_response(t, like_counts.get(t.id, 0), comment_counts.get(t.id, 0))
        for t in threads
    ]
    return ThreadListResponse(total=total, items=items, skip=skip, limit=limit)


def create_thread(
    db: Session,
    payload: ThreadCreate,
    user_id: uuid.UUID,
) -> ThreadResponse:
    if payload.trend_id and not db.query(Trend).filter(Trend.id == payload.trend_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend introuvable")

    thread = Thread(
        author_id=user_id,
        trend_id=payload.trend_id,
        title=payload.title,
        body=payload.body,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)

    thread = (
        db.query(Thread)
        .options(selectinload(Thread.author), selectinload(Thread.trend))
        .filter(Thread.id == thread.id)
        .one()
    )
    return _thread_response(thread, like_count=0, comment_count=0)


def get_thread(
    db: Session,
    thread_id: uuid.UUID,
    user_id: uuid.UUID | None = None,
) -> ThreadDetailResponse:
    thread = (
        db.query(Thread)
        .options(selectinload(Thread.author), selectinload(Thread.trend))
        .filter(Thread.id == thread_id)
        .first()
    )
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread introuvable")

    like_count: int = (
        db.query(func.count(Like.id)).filter(Like.thread_id == thread_id).scalar() or 0
    )
    is_liked = False
    if user_id is not None:
        is_liked = (
            db.query(Like)
            .filter(Like.user_id == user_id, Like.thread_id == thread_id)
            .first()
        ) is not None

    comment_list: CommentListResponse = get_comments(db, thread_id=thread_id, limit=100, user_id=user_id)

    return ThreadDetailResponse(
        id=thread.id,
        author=CommentAuthor(id=thread.author.id, username=thread.author.username, avatar_url=thread.author.avatar_url),
        trend=_trend_snippet(thread.trend),
        title=thread.title,
        body=thread.body,
        is_pinned=thread.is_pinned,
        is_locked=thread.is_locked,
        comment_count=comment_list.total,
        like_count=like_count,
        is_liked=is_liked,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        comments=comment_list.items,
    )


def post_thread_comment(
    db: Session,
    thread_id: uuid.UUID,
    payload: CommentCreate,
    user_id: uuid.UUID,
) -> CommentResponse:
    return post_comment(db, payload, user_id, thread_id=thread_id)


def toggle_thread_like(
    db: Session, thread_id: uuid.UUID, user_id: uuid.UUID
) -> dict:
    if not db.query(Thread).filter(Thread.id == thread_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread introuvable")

    existing = (
        db.query(Like)
        .filter(Like.user_id == user_id, Like.thread_id == thread_id)
        .first()
    )
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(Like(user_id=user_id, thread_id=thread_id))
        liked = True

    db.commit()
    like_count: int = (
        db.query(func.count(Like.id)).filter(Like.thread_id == thread_id).scalar() or 0
    )
    return {"liked": liked, "like_count": like_count}


def delete_thread(
    db: Session, thread_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    thread = db.query(Thread).filter(Thread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread introuvable")
    if thread.author_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée")

    db.delete(thread)
    db.commit()
