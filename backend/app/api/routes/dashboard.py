from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_dashboard_summary(db)
