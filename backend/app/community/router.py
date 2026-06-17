from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.community import service as community_service
from app.dependencies import get_current_user, get_db, get_optional_current_user
from app.models import User
from app.schemas import (
    CommentCreate,
    CommentResponse,
    ThreadCreate,
    ThreadDetailResponse,
    ThreadListResponse,
    ThreadResponse,
)

router = APIRouter(prefix="/community", tags=["community"])


@router.get(
    "/threads",
    response_model=ThreadListResponse,
    summary="Liste des forums (paginée)",
)
def list_threads(
    db: Annotated[Session, Depends(get_db)],
    trend_id: UUID | None = Query(default=None, description="Filtrer par trend"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> ThreadListResponse:
    return community_service.get_threads(db, trend_id=trend_id, skip=skip, limit=limit)


@router.post(
    "/threads",
    response_model=ThreadResponse,
    status_code=201,
    summary="Créer un forum",
)
def create_thread(
    payload: ThreadCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ThreadResponse:
    return community_service.create_thread(db, payload, current_user.id)


@router.get(
    "/threads/{thread_id}",
    response_model=ThreadDetailResponse,
    summary="Détail d'un forum avec ses commentaires",
)
def get_thread(
    thread_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
) -> ThreadDetailResponse:
    user_id = current_user.id if current_user else None
    return community_service.get_thread(db, thread_id, user_id=user_id)


@router.post(
    "/threads/{thread_id}/comments",
    response_model=CommentResponse,
    status_code=201,
    summary="Poster un commentaire dans un forum",
)
def post_thread_comment(
    thread_id: UUID,
    payload: CommentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CommentResponse:
    return community_service.post_thread_comment(db, thread_id, payload, current_user.id)


@router.post(
    "/threads/{thread_id}/like",
    summary="Liker / unliker un forum",
)
def toggle_thread_like(
    thread_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return community_service.toggle_thread_like(db, thread_id, current_user.id)


@router.delete(
    "/threads/{thread_id}",
    status_code=204,
    summary="Supprimer son forum",
)
def delete_thread(
    thread_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    community_service.delete_thread(db, thread_id, current_user.id)
