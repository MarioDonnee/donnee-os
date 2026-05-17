from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import CurrentUserResponse

router = APIRouter()


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user=Depends(get_current_user)):
    return current_user
