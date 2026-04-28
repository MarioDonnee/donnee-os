from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.task_checklist_item import (
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
)
from app.services.task_checklist_service import (
    create_checklist_item,
    delete_checklist_item,
    get_checklist_items,
    update_checklist_item,
)

router = APIRouter()


@router.get("/tasks/{task_id}/checklist", response_model=list[ChecklistItemResponse])
def list_checklist_items(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_checklist_items(db, task_id)


@router.post("/tasks/{task_id}/checklist", response_model=ChecklistItemResponse)
def create(
    task_id: UUID,
    item: ChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    return create_checklist_item(db, task_id, item, current_user)


@router.patch("/checklist-items/{item_id}", response_model=ChecklistItemResponse)
def update(
    item_id: UUID,
    item: ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    updated_item = update_checklist_item(db, item_id, item, current_user)

    if not updated_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    return updated_item


@router.delete("/checklist-items/{item_id}", status_code=204)
def delete(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    deleted_item = delete_checklist_item(db, item_id, current_user)

    if not deleted_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    return Response(status_code=204)
