from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.comments.service import _enrich
from app.community.service import _thread_response
from app.dependencies import get_current_user, get_db
from app.models import Comment, Like, Thread, User
from app.schemas import LikedCommentResponse, LikedThreadResponse

router = APIRouter(prefix="/user/likes", tags=["likes"])


@router.get("/threads", response_model=list[LikedThreadResponse])
def liked_threads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Like, Thread)
        .join(Thread, Like.thread_id == Thread.id)
        .options(selectinload(Thread.author), selectinload(Thread.trend))
        .filter(Like.user_id == current_user.id, Like.thread_id.isnot(None))
        .order_by(Like.created_at.desc())
        .all()
    )

    if not rows:
        return []

    thread_ids = [thread.id for _, thread in rows]

    like_counts = dict(
        db.query(Like.thread_id, func.count(Like.id))
        .filter(Like.thread_id.in_(thread_ids))
        .group_by(Like.thread_id)
        .all()
    )
    comment_counts = dict(
        db.query(Comment.thread_id, func.count(Comment.id))
        .filter(Comment.thread_id.in_(thread_ids), Comment.is_deleted.is_(False))
        .group_by(Comment.thread_id)
        .all()
    )

    return [
        LikedThreadResponse(
            thread=_thread_response(thread, like_counts.get(thread.id, 0), comment_counts.get(thread.id, 0)),
            liked_at=like.created_at,
        )
        for like, thread in rows
    ]


@router.get("/comments", response_model=list[LikedCommentResponse])
def liked_comments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Like, Comment)
        .join(Comment, Like.comment_id == Comment.id)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.thread),
            selectinload(Comment.trend),
        )
        .filter(
            Like.user_id == current_user.id,
            Like.comment_id.isnot(None),
            Comment.is_deleted.is_(False),
        )
        .order_by(Like.created_at.desc())
        .all()
    )

    if not rows:
        return []

    result = []
    for like, comment in rows:
        enriched = _enrich([comment], db)
        if not enriched:
            continue
        if comment.thread:
            context_type = "thread"
            context_id = comment.thread.id
            context_title = comment.thread.title
        elif comment.trend:
            context_type = "trend"
            context_id = comment.trend.id
            context_title = comment.trend.title
        else:
            continue
        result.append(
            LikedCommentResponse(
                comment=enriched[0],
                context_type=context_type,
                context_id=context_id,
                context_title=context_title,
                liked_at=like.created_at,
            )
        )
    return result
