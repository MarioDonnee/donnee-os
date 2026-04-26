from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import (
    create_task,
    get_tasks,
    get_tasks_by_project,
    update_task,
)

router = APIRouter()


@router.post("", response_model=TaskResponse)
def create(task: TaskCreate, db: Session = Depends(get_db)):
    return create_task(db, task)


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    project_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if project_id:
        return get_tasks_by_project(db, project_id)

    return get_tasks(db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update(task_id: UUID, task: TaskUpdate, db: Session = Depends(get_db)):
    updated_task = update_task(db, task_id, task)

    if not updated_task:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated_task
