from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.comments import service as comments_service
from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import CommentCreate, CommentListResponse, CommentResponse

router = APIRouter(tags=["comments"])


@router.get(
    "/trends/{trend_id}/comments",
    response_model=CommentListResponse,
    summary="Commentaires d'une trend (paginés)",
)
def list_trend_comments(
    trend_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> CommentListResponse:
    return comments_service.get_comments(db, trend_id=trend_id, skip=skip, limit=limit)


@router.post(
    "/trends/{trend_id}/comments",
    response_model=CommentResponse,
    status_code=201,
    summary="Poster un commentaire sur une trend",
)
def post_trend_comment(
    trend_id: UUID,
    payload: CommentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CommentResponse:
    return comments_service.post_comment(
        db, payload, current_user.id, trend_id=trend_id
    )


@router.post(
    "/comments/{comment_id}/like",
    summary="Liker / unliker un commentaire",
)
def toggle_comment_like(
    comment_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return comments_service.toggle_comment_like(db, comment_id, current_user.id)


@router.delete(
    "/comments/{comment_id}",
    status_code=204,
    summary="Supprimer son commentaire (soft delete)",
)
def delete_comment(
    comment_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    comments_service.delete_comment(db, comment_id, current_user.id)
