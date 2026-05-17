from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.project_template import ProjectTemplateResponse
from app.services.project_template_service import get_project_templates

router = APIRouter()


@router.get("", response_model=list[ProjectTemplateResponse])
def list_project_templates(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_project_templates(db)
