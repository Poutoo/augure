import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models import FavoriteCollection, FavoriteItem, Thread, Trend
from app.schemas import (
    CollectionCheckResponse,
    FavThreadSnippet,
    FavoriteCollectionCreate,
    FavoriteCollectionResponse,
    FavoriteItemResponse,
    CommentAuthor,
    ThreadTrendSnippet,
)


def _collection_response(
    col: FavoriteCollection,
    item_count: int,
    cover_image_url: str | None = None,
) -> FavoriteCollectionResponse:
    return FavoriteCollectionResponse(
        id=col.id,
        name=col.name,
        emoji=col.emoji,
        item_count=item_count,
        cover_image_url=cover_image_url,
        created_at=col.created_at,
    )


def _item_response(item: FavoriteItem) -> FavoriteItemResponse:
    thread_snippet = None
    if item.thread:
        t = item.thread
        thread_snippet = FavThreadSnippet(
            id=t.id,
            title=t.title,
            body=t.body[:300],
            author=CommentAuthor(id=t.author.id, username=t.author.username, avatar_url=t.author.avatar_url),
            trend=ThreadTrendSnippet(id=t.trend.id, title=t.trend.title, image_url=t.trend.image_url, status=t.trend.status) if t.trend else None,
            created_at=t.created_at,
        )
    return FavoriteItemResponse(
        id=item.id,
        collection_id=item.collection_id,
        added_at=item.added_at,
        thread=thread_snippet,
        trend_id=item.trend.id if item.trend else None,
        trend_title=item.trend.title if item.trend else None,
        trend_image=item.trend.image_url if item.trend else None,
        trend_status=item.trend.status if item.trend else None,
    )


def get_collections(user_id: uuid.UUID, db: Session) -> list[FavoriteCollectionResponse]:
    cnt_subq = (
        select(FavoriteItem.collection_id, func.count(FavoriteItem.id).label("cnt"))
        .group_by(FavoriteItem.collection_id)
        .subquery()
    )
    # First trend-with-image per collection (earliest item that has an image)
    earliest_subq = (
        select(FavoriteItem.collection_id, func.min(FavoriteItem.added_at).label("earliest_at"))
        .join(Trend, FavoriteItem.trend_id == Trend.id)
        .where(FavoriteItem.trend_id.isnot(None))
        .where(Trend.image_url.isnot(None))
        .group_by(FavoriteItem.collection_id)
        .subquery()
    )
    cover_subq = (
        select(FavoriteItem.collection_id, Trend.image_url.label("cover_url"))
        .join(Trend, FavoriteItem.trend_id == Trend.id)
        .join(
            earliest_subq,
            (FavoriteItem.collection_id == earliest_subq.c.collection_id)
            & (FavoriteItem.added_at == earliest_subq.c.earliest_at),
        )
        .subquery()
    )
    rows = (
        db.query(FavoriteCollection, cnt_subq.c.cnt, cover_subq.c.cover_url)
        .outerjoin(cnt_subq, FavoriteCollection.id == cnt_subq.c.collection_id)
        .outerjoin(cover_subq, FavoriteCollection.id == cover_subq.c.collection_id)
        .filter(FavoriteCollection.user_id == user_id)
        .order_by(FavoriteCollection.created_at.desc())
        .all()
    )
    return [_collection_response(col, cnt or 0, cover_url) for col, cnt, cover_url in rows]


def create_collection(user_id: uuid.UUID, payload: FavoriteCollectionCreate, db: Session) -> FavoriteCollectionResponse:
    col = FavoriteCollection(user_id=user_id, name=payload.name, emoji=payload.emoji)
    db.add(col)
    db.commit()
    db.refresh(col)
    return _collection_response(col, 0)


def update_collection(user_id: uuid.UUID, collection_id: uuid.UUID, payload: FavoriteCollectionCreate, db: Session) -> FavoriteCollectionResponse:
    col = _get_owned_collection(user_id, collection_id, db)
    col.name = payload.name
    col.emoji = payload.emoji
    db.commit()
    db.refresh(col)
    item_count = db.query(func.count(FavoriteItem.id)).filter(FavoriteItem.collection_id == col.id).scalar() or 0
    return _collection_response(col, item_count)


def delete_collection(user_id: uuid.UUID, collection_id: uuid.UUID, db: Session) -> None:
    col = _get_owned_collection(user_id, collection_id, db)
    db.delete(col)
    db.commit()


def get_items(user_id: uuid.UUID, collection_id: uuid.UUID, db: Session) -> list[FavoriteItemResponse]:
    _get_owned_collection(user_id, collection_id, db)
    items = (
        db.query(FavoriteItem)
        .options(
            selectinload(FavoriteItem.thread).selectinload(Thread.author),
            selectinload(FavoriteItem.thread).selectinload(Thread.trend),
            selectinload(FavoriteItem.trend),
        )
        .filter(FavoriteItem.collection_id == collection_id)
        .order_by(FavoriteItem.added_at.desc())
        .all()
    )
    return [_item_response(item) for item in items]


def add_item(
    user_id: uuid.UUID,
    collection_id: uuid.UUID,
    thread_id: uuid.UUID | None,
    trend_id: uuid.UUID | None,
    db: Session,
) -> FavoriteItemResponse:
    _get_owned_collection(user_id, collection_id, db)
    if not thread_id and not trend_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="thread_id ou trend_id requis")
    if thread_id and not db.query(Thread).filter(Thread.id == thread_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread introuvable")
    if trend_id and not db.query(Trend).filter(Trend.id == trend_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend introuvable")

    item = FavoriteItem(collection_id=collection_id, thread_id=thread_id, trend_id=trend_id)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Item déjà dans cette collection")
    item = (
        db.query(FavoriteItem)
        .options(
            selectinload(FavoriteItem.thread).selectinload(Thread.author),
            selectinload(FavoriteItem.thread).selectinload(Thread.trend),
            selectinload(FavoriteItem.trend),
        )
        .filter(FavoriteItem.id == item.id)
        .one()
    )
    return _item_response(item)


def remove_item(
    user_id: uuid.UUID,
    collection_id: uuid.UUID,
    thread_id: uuid.UUID | None,
    trend_id: uuid.UUID | None,
    db: Session,
) -> None:
    _get_owned_collection(user_id, collection_id, db)
    q = db.query(FavoriteItem).filter(FavoriteItem.collection_id == collection_id)
    if thread_id:
        q = q.filter(FavoriteItem.thread_id == thread_id)
    elif trend_id:
        q = q.filter(FavoriteItem.trend_id == trend_id)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="thread_id ou trend_id requis")
    item = q.first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item introuvable")
    db.delete(item)
    db.commit()


def check_collections(
    user_id: uuid.UUID,
    thread_id: uuid.UUID | None,
    trend_id: uuid.UUID | None,
    db: Session,
) -> CollectionCheckResponse:
    if not thread_id and not trend_id:
        return CollectionCheckResponse(collection_ids=[])
    q = (
        db.query(FavoriteItem.collection_id)
        .join(FavoriteCollection, FavoriteItem.collection_id == FavoriteCollection.id)
        .filter(FavoriteCollection.user_id == user_id)
    )
    if thread_id:
        q = q.filter(FavoriteItem.thread_id == thread_id)
    else:
        q = q.filter(FavoriteItem.trend_id == trend_id)
    ids = [row[0] for row in q.all()]
    return CollectionCheckResponse(collection_ids=ids)


def _get_owned_collection(user_id: uuid.UUID, collection_id: uuid.UUID, db: Session) -> FavoriteCollection:
    col = db.query(FavoriteCollection).filter(FavoriteCollection.id == collection_id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection introuvable")
    if col.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Action non autorisée")
    return col
