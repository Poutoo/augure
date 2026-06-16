import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.favorites import service as fav_service
from app.models import User
from app.schemas import (
    CollectionCheckResponse,
    FavoriteCollectionCreate,
    FavoriteCollectionResponse,
    FavoriteItemResponse,
)

router = APIRouter(prefix="/user/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteCollectionResponse])
def list_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.get_collections(current_user.id, db)


@router.post("", response_model=FavoriteCollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    payload: FavoriteCollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.create_collection(current_user.id, payload, db)


@router.patch("/{collection_id}", response_model=FavoriteCollectionResponse)
def update_collection(
    collection_id: uuid.UUID,
    payload: FavoriteCollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.update_collection(current_user.id, collection_id, payload, db)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav_service.delete_collection(current_user.id, collection_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/check", response_model=CollectionCheckResponse)
def check_collections(
    thread_id: uuid.UUID | None = None,
    trend_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.check_collections(current_user.id, thread_id, trend_id, db)


@router.get("/{collection_id}/items", response_model=list[FavoriteItemResponse])
def list_items(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.get_items(current_user.id, collection_id, db)


@router.post("/{collection_id}/items", response_model=FavoriteItemResponse, status_code=status.HTTP_201_CREATED)
def add_item(
    collection_id: uuid.UUID,
    thread_id: uuid.UUID | None = None,
    trend_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return fav_service.add_item(current_user.id, collection_id, thread_id, trend_id, db)


@router.delete("/{collection_id}/items", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(
    collection_id: uuid.UUID,
    thread_id: uuid.UUID | None = None,
    trend_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav_service.remove_item(current_user.id, collection_id, thread_id, trend_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
