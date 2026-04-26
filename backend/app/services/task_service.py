from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.task import Task
from app.models.project import Project
from app.services.activity_log_service import create_log


def create_task(db: Session, data):
    project = (
        db.query(Project)
        .filter(Project.id == data.project_id, Project.deleted_at.is_(None))
        .first()
    )

    if not project:
        raise HTTPException(status_code=400, detail="Project does not exist")

    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="created",
        new_value=data.model_dump(mode="json"),
    )

    return task


def get_tasks(db: Session):
    return db.query(Task).filter(Task.deleted_at.is_(None)).all()


def get_tasks_by_project(db: Session, project_id: UUID):
    return (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.deleted_at.is_(None))
        .all()
    )


def update_task(db: Session, task_id: UUID, data):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.deleted_at.is_(None))
        .first()
    )

    if not task:
        return None

    update_data = data.model_dump(exclude_unset=True)

    if "project_id" in update_data:
        project = (
            db.query(Project)
            .filter(Project.id == update_data["project_id"], Project.deleted_at.is_(None))
            .first()
        )

        if not project:
            raise HTTPException(status_code=400, detail="Project does not exist")

    old_data = {
        "title": task.title,
        "status": task.status,
        "priority": task.priority,
    }

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="updated",
        old_value=old_data,
        new_value=data.model_dump(mode="json", exclude_unset=True),
    )

    return task
