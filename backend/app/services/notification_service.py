from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    body: str,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notifications(
    db: Session,
    user_id: UUID,
    limit: int = 50,
    unread_only: bool = False,
    entity_type: str | None = None,
) -> dict:
    bounded_limit = min(max(limit, 1), 100)
    query = db.query(Notification).filter(Notification.user_id == user_id)

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    if entity_type:
        query = query.filter(Notification.entity_type == entity_type)

    items = query.order_by(Notification.created_at.desc()).limit(bounded_limit).all()
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )
    return {"items": items, "unread_count": unread_count}


def get_unread_count(db: Session, user_id: UUID) -> int:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .count()
    )


def mark_as_read(db: Session, notification_id: UUID, user_id: UUID) -> Notification | None:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        return None
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, user_id: UUID) -> None:
    (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({"is_read": True, "read_at": datetime.now(timezone.utc)})
    )
    db.commit()
