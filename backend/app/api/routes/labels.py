from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.label import LabelCreate, LabelResponse, TaskLabelAttach
from app.schemas.task import TaskResponse
from app.services.label_service import (
    attach_label_to_task,
    create_label,
    detach_label_from_task,
    get_labels,
)

router = APIRouter()


@router.get("/labels", response_model=list[LabelResponse])
def list_labels(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_labels(db)


@router.post("/labels", response_model=LabelResponse)
def create(
    label: LabelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    return create_label(db, label, current_user)


@router.post("/tasks/{task_id}/labels", response_model=TaskResponse)
def attach(
    task_id: UUID,
    payload: TaskLabelAttach,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    return attach_label_to_task(db, task_id, payload.label_id, current_user)


@router.delete("/tasks/{task_id}/labels/{label_id}", response_model=TaskResponse)
def detach(
    task_id: UUID,
    label_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    return detach_label_from_task(db, task_id, label_id, current_user)
