import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS = {
    "ADMIN": {"ADMIN", "MANAGER", "ANALYST", "VIEWER"},
    "MANAGER": {"MANAGER", "ANALYST", "VIEWER"},
    "ANALYST": {"ANALYST", "VIEWER"},
    "VIEWER": {"VIEWER"},
}


def get_supabase_user(token: str):
    request = Request(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
        headers={
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {token}",
        },
    )

    try:
        with urlopen(request, timeout=8) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid authentication token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    supabase_user = get_supabase_user(credentials.credentials)
    auth_user_id = supabase_user.get("id")
    email = supabase_user.get("email")

    if not auth_user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user = (
        db.query(User)
        .filter(User.auth_user_id == UUID(auth_user_id), User.deleted_at.is_(None))
        .first()
    )

    if not user:
        user = (
            db.query(User)
            .filter(User.email == email, User.deleted_at.is_(None))
            .first()
        )

        if user and not user.auth_user_id:
            user.auth_user_id = UUID(auth_user_id)
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "USER_NOT_ALLOWLISTED",
                "message": "User is not authorized",
            },
        )

    if user.status == "PENDING":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "USER_PENDING",
                "message": "User access is pending approval",
            },
        )

    if user.status == "INACTIVE":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "USER_INACTIVE",
                "message": "User access is inactive",
            },
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "USER_NOT_AUTHORIZED",
                "message": "User is not authorized",
            },
        )

    return user


def require_roles(*allowed_roles: str):
    def dependency(current_user: User = Depends(get_current_user)):
        effective_roles = ROLE_PERMISSIONS.get(current_user.role, {current_user.role})

        if not effective_roles.intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "INSUFFICIENT_ROLE",
                    "message": "User role cannot perform this action",
                },
            )

        return current_user

    return dependency
