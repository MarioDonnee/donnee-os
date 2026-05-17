from uuid import UUID
from datetime import date, datetime, timezone

from sqlalchemy import Integer, func, or_
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.label import Label
from app.models.task import Task
from app.models.task_checklist_item import TaskChecklistItem
from app.models.task_label import TaskLabel
from app.models.project import Project
from app.services.activity_log_service import create_log
from app.services.notification_service import create_notification
from app.services.risk_service import (
    attach_due_status_to_task,
    attach_due_status_to_tasks,
    calculate_due_status,
    handle_task_automations,
)

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
    attach_due_status_to_task(task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="created",
        new_value={**data.model_dump(mode="json"), "position": task.position},
        user_id=current_user.id if current_user else None,
    )

    handle_task_automations(
        db,
        task,
        old_status=None,
        old_priority=None,
        old_due_status=None,
        current_user=current_user,
    )

    return task


def attach_checklist_counts_to_tasks(db: Session, tasks: list[Task]):
    if not tasks:
        return tasks

    task_ids = [task.id for task in tasks]

    try:
        rows = (
            db.query(
                TaskChecklistItem.task_id,
                func.count(TaskChecklistItem.id).label("total"),
                func.sum(TaskChecklistItem.is_done.cast(Integer)).label("done"),
            )
            .filter(
                TaskChecklistItem.task_id.in_(task_ids),
                TaskChecklistItem.deleted_at.is_(None),
            )
            .group_by(TaskChecklistItem.task_id)
            .all()
        )
    except ProgrammingError:
        db.rollback()

        for task in tasks:
            task.checklist_total = 0
            task.checklist_done = 0

        return tasks

    counts_by_task_id = {
        task_id: {
            "total": int(total or 0),
            "done": int(done or 0),
        }
        for task_id, total, done in rows
    }

    for task in tasks:
        counts = counts_by_task_id.get(task.id, {"total": 0, "done": 0})
        task.checklist_total = counts["total"]
        task.checklist_done = counts["done"]

    return tasks


def attach_checklist_counts_to_task(db: Session, task: Task):
    attach_checklist_counts_to_tasks(db, [task])
    return task


def attach_labels_to_tasks(db: Session, tasks: list[Task]):
    if not tasks:
        return tasks

    task_ids = [task.id for task in tasks]

    try:
        rows = (
            db.query(TaskLabel.task_id, Label)
            .join(Label, Label.id == TaskLabel.label_id)
            .filter(TaskLabel.task_id.in_(task_ids), Label.deleted_at.is_(None))
            .order_by(Label.name.asc())
            .all()
        )
    except ProgrammingError:
        db.rollback()

        for task in tasks:
            task.labels = []
            task.checklist_total = 0
            task.checklist_done = 0

        return tasks

    labels_by_task_id = {task_id: [] for task_id in task_ids}

    for task_id, label in rows:
        labels_by_task_id.setdefault(task_id, []).append(label)

    for task in tasks:
        task.labels = labels_by_task_id.get(task.id, [])

    return tasks


def attach_labels_to_task(db: Session, task: Task):
    attach_labels_to_tasks(db, [task])
    return task


def get_tasks(
    db: Session,
    project_id: UUID | None = None,
    client_id: UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    label_id: UUID | None = None,
    overdue: bool = False,
    search: str | None = None,
    only_mine: bool = False,
    current_user=None,
):
    query = db.query(Task)

    if client_id:
        query = query.join(Project, Project.id == Task.project_id)

    if label_id:
        query = query.join(TaskLabel, TaskLabel.task_id == Task.id)

    query = query.filter(Task.deleted_at.is_(None))

    if project_id:
        query = query.filter(Task.project_id == project_id)

    if client_id:
        query = query.filter(Project.client_id == client_id, Project.deleted_at.is_(None))

    if status:
        query = query.filter(Task.status == status)

    if priority:
        query = query.filter(Task.priority == priority)

    if label_id:
        query = query.filter(TaskLabel.label_id == label_id)

    if overdue:
        query = query.filter(
            Task.due_date < date.today(),
            Task.status.notin_(["DONE", "CANCELLED"]),
        )

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
            )
        )

    if only_mine and current_user:
        query = query.filter(Task.assignee_id == current_user.id)

    try:
        tasks = (
            query
            .order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc())
            .all()
        )
    except ProgrammingError:
        db.rollback()

        if label_id:
            return []

        fallback_query = db.query(Task).filter(Task.deleted_at.is_(None))

        if project_id:
            fallback_query = fallback_query.filter(Task.project_id == project_id)

        if client_id:
            fallback_query = (
                fallback_query
                .join(Project, Project.id == Task.project_id)
                .filter(Project.client_id == client_id, Project.deleted_at.is_(None))
            )

        if status:
            fallback_query = fallback_query.filter(Task.status == status)

        if priority:
            fallback_query = fallback_query.filter(Task.priority == priority)

        if overdue:
            fallback_query = fallback_query.filter(
                Task.due_date < date.today(),
                Task.status.notin_(["DONE", "CANCELLED"]),
            )

        if search:
            search_pattern = f"%{search.strip()}%"
            fallback_query = fallback_query.filter(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern),
                )
            )

        if only_mine and current_user:
            fallback_query = fallback_query.filter(Task.assignee_id == current_user.id)

        tasks = (
            fallback_query
            .order_by(Task.status.asc(), Task.position.asc(), Task.created_at.asc())
            .all()
        )

        for task in tasks:
            task.labels = []
            attach_due_status_to_task(task)

        return tasks

    attach_labels_to_tasks(db, tasks)
    attach_due_status_to_tasks(tasks)
    return attach_checklist_counts_to_tasks(db, tasks)


def get_tasks_by_project(db: Session, project_id: UUID):
    return get_tasks(db, project_id=project_id)


def get_task_by_id(db: Session, task_id: UUID):
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.deleted_at.is_(None))
        .first()
    )

    if task:
        attach_labels_to_task(db, task)
        attach_checklist_counts_to_task(db, task)
        attach_due_status_to_task(task)

    return task


def update_task(db: Session, task_id: UUID, data, current_user=None):
    task = get_task_by_id(db, task_id)

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
        "start_date": task.start_date.isoformat() if task.start_date else None,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }
    old_assignee_id = task.assignee_id
    old_status = task.status
    old_priority = task.priority
    old_due_status = calculate_due_status(task)

    for field, value in update_data.items():
        setattr(task, field, value)

    if "status" in update_data:
        if task.status == "DONE" and task.completed_at is None:
            task.completed_at = datetime.now(timezone.utc)
        elif task.status != "DONE":
            task.completed_at = None

    db.commit()
    db.refresh(task)
    attach_labels_to_task(db, task)
    attach_checklist_counts_to_task(db, task)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task.id,
        action="updated",
        old_value=old_data,
        new_value=data.model_dump(mode="json", exclude_unset=True),
        user_id=current_user.id if current_user else None,
    )

    new_assignee_id = task.assignee_id
    if (
        "assignee_id" in update_data
        and new_assignee_id
        and new_assignee_id != old_assignee_id
        and (current_user is None or new_assignee_id != current_user.id)
    ):
        create_notification(
            db=db,
            user_id=new_assignee_id,
            type="task_assigned",
            title="Nova tarefa atribuída",
            body=f'Você foi atribuído à tarefa "{task.title}"',
            entity_type="task",
            entity_id=task.id,
        )

    handle_task_automations(
        db,
        task,
        old_status=old_status,
        old_priority=old_priority,
        old_due_status=old_due_status,
        current_user=current_user,
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
    old_status = task.status
    old_priority = task.priority
    old_due_status = calculate_due_status(task)

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

    if task.status == "DONE" and task.completed_at is None:
        task.completed_at = datetime.now(timezone.utc)
    elif task.status != "DONE":
        task.completed_at = None

    db.commit()
    db.refresh(task)
    attach_labels_to_task(db, task)
    attach_checklist_counts_to_task(db, task)

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

    handle_task_automations(
        db,
        task,
        old_status=old_status,
        old_priority=old_priority,
        old_due_status=old_due_status,
        current_user=current_user,
    )

    return task
