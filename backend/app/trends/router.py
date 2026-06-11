from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import PaginatedTrends, TrendListResponse, TrendResponse
from app.trends import service as trends_service

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get(
    "/list",
    response_model=TrendListResponse,
    summary="Liste paginée de toutes les tendances",
)
def list_trends(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = Query(default=None, description="Filtrer par catégorie"),
    q: str | None = Query(default=None, description="Recherche textuelle"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> TrendListResponse:
    return trends_service.get_all_trends(db, category=category, q=q, skip=skip, limit=limit)


@router.get(
    "/recommend",
    response_model=PaginatedTrends,
    summary="Tendances personnalisées scorées selon le profil utilisateur",
)
def recommend(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    skip: int = Query(default=0, ge=0, description="Offset de pagination"),
    limit: int = Query(default=20, ge=1, le=100, description="Taille de la page"),
) -> PaginatedTrends:
    return trends_service.get_personalized_trends(
        current_user.id, db, skip=skip, limit=limit
    )


@router.get(
    "/{trend_id}",
    response_model=TrendResponse,
    summary="Détail d'une tendance par son ID",
)
def get_trend(
    trend_id: UUID,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TrendResponse:
    return trends_service.get_trend_by_id(trend_id, db)
