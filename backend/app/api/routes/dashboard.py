from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    return get_dashboard_summary(db)
