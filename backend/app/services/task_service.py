from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.task import Task
from app.models.project import Project
from app.services.activity_log_service import create_log

VALID_TASK_STATUSES = {
    "BACKLOG",
    "IN_PROGRESS",
    "REVIEW",
    "BLOCKED",
    "DONE",
    "CANCELLED",
}


def create_task(db: Session, data, current_user=None):
    project = (
        db.query(Project)
        .filter(Project.id == data.project_id, Project.deleted_at.is_(None))
        .first()
    )

    if not project:
        raise HTTPException(status_code=400, detail="Project does not exist")

    next_position = (
        db.query(Task)
        .filter(Task.status == "BACKLOG", Task.deleted_at.is_(None))
        .count()
    )

    task_data = data.model_dump()

    if current_user:
        task_data["created_by"] = current_user.id

    task = Task(**task_data, position=next_position)
    db.add(task)
    db.commit()
    db.refresh(task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="created",
        new_value={**data.model_dump(mode="json"), "position": task.position},
        user_id=current_user.id if current_user else None,
    )

    return task


def get_tasks(db: Session):
    return (
        db.query(Task)
        .filter(Task.deleted_at.is_(None))
        .order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc())
        .all()
    )


def get_tasks_by_project(db: Session, project_id: UUID):
    return (
        db.query(Task)
        .filter(Task.project_id == project_id, Task.deleted_at.is_(None))
        .order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc())
        .all()
    )


def update_task(db: Session, task_id: UUID, data, current_user=None):
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
        "position": task.position,
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
        user_id=current_user.id if current_user else None,
    )

    return task


def move_task(db: Session, task_id: UUID, data, current_user=None):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.deleted_at.is_(None))
        .first()
    )

    if not task:
        return None

    old_value = {
        "status": task.status,
        "position": task.position,
    }

    next_status = data.status
    next_position = max(data.position, 0)

    if next_status not in VALID_TASK_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid task status")

    if task.status == next_status:
        siblings = (
            db.query(Task)
            .filter(
                Task.status == task.status,
                Task.id != task.id,
                Task.deleted_at.is_(None),
            )
            .order_by(Task.position.asc(), Task.created_at.asc())
            .all()
        )

        bounded_position = min(next_position, len(siblings))
        ordered_tasks = siblings[:bounded_position] + [task] + siblings[bounded_position:]

        for index, current_task in enumerate(ordered_tasks):
            current_task.position = index
    else:
        source_tasks = (
            db.query(Task)
            .filter(
                Task.status == task.status,
                Task.id != task.id,
                Task.deleted_at.is_(None),
            )
            .order_by(Task.position.asc(), Task.created_at.asc())
            .all()
        )
        destination_tasks = (
            db.query(Task)
            .filter(
                Task.status == next_status,
                Task.id != task.id,
                Task.deleted_at.is_(None),
            )
            .order_by(Task.position.asc(), Task.created_at.asc())
            .all()
        )

        for index, current_task in enumerate(source_tasks):
            current_task.position = index

        bounded_position = min(next_position, len(destination_tasks))
        ordered_destination_tasks = (
            destination_tasks[:bounded_position]
            + [task]
            + destination_tasks[bounded_position:]
        )

        task.status = next_status

        for index, current_task in enumerate(ordered_destination_tasks):
            current_task.position = index

    db.commit()
    db.refresh(task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="moved",
        old_value=old_value,
        new_value={
            "status": task.status,
            "position": task.position,
        },
        user_id=current_user.id if current_user else None,
    )

    return task
