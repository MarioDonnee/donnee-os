from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db

router = APIRouter()


@router.get("")
def test_database_connection(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    result = db.execute(text("select now() as current_time")).mappings().first()

    return {
        "status": "ok",
        "database": "connected",
        "current_time": str(result["current_time"]),
    }
