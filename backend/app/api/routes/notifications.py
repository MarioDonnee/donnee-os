from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.notification import NotificationListResponse, NotificationResponse, UnreadCountResponse
from app.services.notification_service import (
    get_notifications,
    get_unread_count,
    mark_all_as_read,
    mark_as_read,
)

router = APIRouter()


@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_notifications(db, current_user.id)


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return {"unread_count": get_unread_count(db, current_user.id)}


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def read_one(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    notification = mark_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.patch("/notifications/read-all", status_code=204)
def read_all(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    mark_all_as_read(db, current_user.id)
    return Response(status_code=204)
