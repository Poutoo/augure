import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models import Comment, Like, Trend, Thread
from app.schemas import (
    CommentAuthor,
    CommentCreate,
    CommentListResponse,
    CommentResponse,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_comment_responses(
    comments: list[Comment],
    replies_map: dict[uuid.UUID, list[Comment]],
    like_count_map: dict[uuid.UUID, int],
    liked_ids: set[uuid.UUID] | None = None,
) -> list[CommentResponse]:
    return [
        CommentResponse(
            id=c.id,
            author=CommentAuthor(id=c.author.id, username=c.author.username, avatar_url=c.author.avatar_url, is_verified=c.author.is_verified),
            body="[Commentaire supprimé]" if c.is_deleted else c.body,
            like_count=like_count_map.get(c.id, 0),
            is_liked=c.id in liked_ids if liked_ids is not None else False,
            is_deleted=c.is_deleted,
            parent_comment_id=c.parent_comment_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            replies=_build_comment_responses(
                replies_map.get(c.id, []), {}, like_count_map, liked_ids
            ),
        )
        for c in comments
    ]


def _load_top_level(
    db: Session,
    *,
    trend_id: uuid.UUID | None = None,
    thread_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[int, list[Comment]]:
    q = (
        db.query(Comment)
        .options(selectinload(Comment.author))
        .filter(Comment.parent_comment_id.is_(None))
    )
    if trend_id:
        q = q.filter(Comment.trend_id == trend_id)
    if thread_id:
        q = q.filter(Comment.thread_id == thread_id)

    total: int = q.count()
    rows = q.order_by(Comment.created_at.asc()).offset(skip).limit(limit).all()
    return total, rows


def _enrich(
    top_level: list[Comment],
    db: Session,
    user_id: uuid.UUID | None = None,
) -> list[CommentResponse]:
    if not top_level:
        return []

    top_ids = [c.id for c in top_level]

    all_replies: list[Comment] = (
        db.query(Comment)
        .options(selectinload(Comment.author))
        .filter(Comment.parent_comment_id.in_(top_ids))
        .order_by(Comment.created_at.asc())
        .all()
    )
    replies_map: dict[uuid.UUID, list[Comment]] = {}
    for r in all_replies:
        replies_map.setdefault(r.parent_comment_id, []).append(r)

    all_ids = top_ids + [r.id for r in all_replies]
    like_count_map: dict[uuid.UUID, int] = dict(
        db.query(Like.comment_id, func.count(Like.id))
        .filter(Like.comment_id.in_(all_ids))
        .group_by(Like.comment_id)
        .all()
    )

    liked_ids: set[uuid.UUID] | None = None
    if user_id is not None:
        liked_ids = {
            row[0]
            for row in db.query(Like.comment_id)
            .filter(Like.user_id == user_id, Like.comment_id.in_(all_ids))
            .all()
        }

    return _build_comment_responses(top_level, replies_map, like_count_map, liked_ids)


# ── CRUD ──────────────────────────────────────────────────────────────────────

def get_comments(
    db: Session,
    *,
    trend_id: uuid.UUID | None = None,
    thread_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 20,
    user_id: uuid.UUID | None = None,
) -> CommentListResponse:
    total, top_level = _load_top_level(
        db, trend_id=trend_id, thread_id=thread_id, skip=skip, limit=limit
    )
    items = _enrich(top_level, db, user_id=user_id)
    return CommentListResponse(total=total, items=items, skip=skip, limit=limit)


def post_comment(
    db: Session,
    payload: CommentCreate,
    user_id: uuid.UUID,
    *,
    trend_id: uuid.UUID | None = None,
    thread_id: uuid.UUID | None = None,
) -> CommentResponse:
    if not trend_id and not thread_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="trend_id ou thread_id requis")

    if trend_id and not db.query(Trend).filter(Trend.id == trend_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend introuvable")

    if thread_id and not db.query(Thread).filter(Thread.id == thread_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread introuvable")

    if payload.parent_comment_id:
        parent = db.query(Comment).filter(Comment.id == payload.parent_comment_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commentaire parent introuvable")
        if parent.parent_comment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Les réponses imbriquées au-delà d'un niveau ne sont pas supportées")

    comment = Comment(
        author_id=user_id,
        trend_id=trend_id,
        thread_id=thread_id,
        parent_comment_id=payload.parent_comment_id,
        body=payload.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    comment = (
        db.query(Comment)
        .options(selectinload(Comment.author))
        .filter(Comment.id == comment.id)
        .one()
    )
    items = _enrich([comment], db)
    return items[0]


def toggle_comment_like(
    db: Session, comment_id: uuid.UUID, user_id: uuid.UUID
) -> dict:
    if not db.query(Comment).filter(Comment.id == comment_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commentaire introuvable")

    existing = (
        db.query(Like)
        .filter(Like.user_id == user_id, Like.comment_id == comment_id)
        .first()
    )
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(Like(user_id=user_id, comment_id=comment_id))
        liked = True

    db.commit()
    like_count: int = (
        db.query(func.count(Like.id)).filter(Like.comment_id == comment_id).scalar() or 0
    )
    return {"liked": liked, "like_count": like_count}


def delete_comment(db: Session, comment_id: uuid.UUID, user_id: uuid.UUID) -> None:
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commentaire introuvable")
    if comment.author_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée")

    comment.is_deleted = True
    db.commit()
