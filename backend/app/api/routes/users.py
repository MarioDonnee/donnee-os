from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User
from app.schemas.users import UserResponse, UserUpdate

router = APIRouter()

VALID_ROLES = {"ADMIN", "MANAGER", "ANALYST", "VIEWER"}
VALID_STATUSES = {"ACTIVE", "INACTIVE", "PENDING"}


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return (
        db.query(User)
        .filter(User.deleted_at.is_(None))
        .order_by(User.name)
        .all()
    )


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.role is not None:
        if body.role not in VALID_ROLES:
            raise HTTPException(status_code=422, detail=f"Invalid role: {body.role}")
        user.role = body.role

    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"Invalid status: {body.status}")
        user.status = body.status

    db.commit()
    db.refresh(user)
    return user
