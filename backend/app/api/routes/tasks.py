from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskMove, TaskResponse, TaskUpdate
from app.schemas.activity_log import ActivityLogResponse
from app.services.activity_log_service import get_logs_for_entity
from app.services.task_service import (
    create_task,
    get_task_by_id,
    get_tasks,
    move_task,
    update_task,
)

router = APIRouter()


@router.post("", response_model=TaskResponse)
def create(task: TaskCreate, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST"))):
    return create_task(db, task, current_user)


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    project_id: UUID | None = Query(default=None),
    client_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    label_id: UUID | None = Query(default=None),
    overdue: bool = Query(default=False),
    search: str | None = Query(default=None),
    only_mine: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_tasks(
        db=db,
        project_id=project_id,
        client_id=client_id,
        status=status,
        priority=priority,
        label_id=label_id,
        overdue=overdue,
        search=search,
        only_mine=only_mine,
        current_user=current_user,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_one(task_id: UUID, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.get("/{task_id}/activity", response_model=list[ActivityLogResponse])
def get_activity(task_id: UUID, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER"))):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return get_logs_for_entity(db, "task", task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
def update(task_id: UUID, task: TaskUpdate, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST"))):
    updated_task = update_task(db, task_id, task, current_user)

    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated_task


@router.patch("/{task_id}/move", response_model=TaskResponse)
def move(task_id: UUID, task_move: TaskMove, db: Session = Depends(get_db), current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST"))):
    moved_task = move_task(db, task_id, task_move, current_user)

    if not moved_task:
        raise HTTPException(status_code=404, detail="Task not found")

    return moved_task
