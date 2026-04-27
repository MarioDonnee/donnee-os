from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskMove, TaskResponse, TaskUpdate
from app.services.task_service import (
    create_task,
    get_tasks,
    get_tasks_by_project,
    move_task,
    update_task,
)

router = APIRouter()


@router.post("", response_model=TaskResponse)
def create(task: TaskCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_task(db, task, current_user)


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    project_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if project_id:
        return get_tasks_by_project(db, project_id)

    return get_tasks(db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update(task_id: UUID, task: TaskUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated_task = update_task(db, task_id, task, current_user)

    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated_task


@router.patch("/{task_id}/move", response_model=TaskResponse)
def move(task_id: UUID, task_move: TaskMove, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    moved_task = move_task(db, task_id, task_move, current_user)

    if not moved_task:
        raise HTTPException(status_code=404, detail="Task not found")

    return moved_task
