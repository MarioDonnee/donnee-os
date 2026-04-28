from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.task_checklist_item import TaskChecklistItem
from app.services.activity_log_service import create_log
from app.services.task_service import get_task_by_id


def normalize_positions(db: Session, task_id: UUID):
    items = (
        db.query(TaskChecklistItem)
        .filter(
            TaskChecklistItem.task_id == task_id,
            TaskChecklistItem.deleted_at.is_(None),
        )
        .order_by(TaskChecklistItem.position.asc(), TaskChecklistItem.created_at.asc())
        .all()
    )

    for index, item in enumerate(items):
        item.position = index

    return items


def get_checklist_items(db: Session, task_id: UUID):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        return (
            db.query(TaskChecklistItem)
            .filter(
                TaskChecklistItem.task_id == task_id,
                TaskChecklistItem.deleted_at.is_(None),
            )
            .order_by(TaskChecklistItem.position.asc(), TaskChecklistItem.created_at.asc())
            .all()
        )
    except ProgrammingError:
        db.rollback()
        return []


def create_checklist_item(db: Session, task_id: UUID, data, current_user):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        next_position = (
            db.query(TaskChecklistItem)
            .filter(
                TaskChecklistItem.task_id == task_id,
                TaskChecklistItem.deleted_at.is_(None),
            )
            .count()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Checklist migration has not been applied")

    item = TaskChecklistItem(
        task_id=task_id,
        title=data.title,
        assignee_id=data.assignee_id,
        due_date=data.due_date,
        position=next_position,
        created_by=current_user.id,
    )

    db.add(item)

    try:
        db.commit()
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Checklist migration has not been applied")

    db.refresh(item)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task_id,
        action="checklist_item_created",
        new_value={"item_id": str(item.id), "title": item.title},
        user_id=current_user.id,
    )

    return item


def update_checklist_item(db: Session, item_id: UUID, data, current_user):
    try:
        item = (
            db.query(TaskChecklistItem)
            .filter(TaskChecklistItem.id == item_id, TaskChecklistItem.deleted_at.is_(None))
            .first()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Checklist migration has not been applied")

    if not item:
        return None

    update_data = data.model_dump(exclude_unset=True)
    old_value = {
        "title": item.title,
        "is_done": item.is_done,
        "position": item.position,
        "assignee_id": str(item.assignee_id) if item.assignee_id else None,
        "due_date": item.due_date.isoformat() if item.due_date else None,
    }
    action = "checklist_item_updated"

    if "is_done" in update_data and update_data["is_done"] != item.is_done:
        action = "checklist_item_completed" if update_data["is_done"] else "checklist_item_reopened"
        item.completed_at = datetime.now(timezone.utc) if update_data["is_done"] else None

    requested_position = update_data.pop("position", None)

    for field, value in update_data.items():
        setattr(item, field, value)

    if requested_position is not None:
        siblings = (
            db.query(TaskChecklistItem)
            .filter(
                TaskChecklistItem.task_id == item.task_id,
                TaskChecklistItem.id != item.id,
                TaskChecklistItem.deleted_at.is_(None),
            )
            .order_by(TaskChecklistItem.position.asc(), TaskChecklistItem.created_at.asc())
            .all()
        )
        bounded_position = min(max(requested_position, 0), len(siblings))
        ordered_items = siblings[:bounded_position] + [item] + siblings[bounded_position:]

        for index, current_item in enumerate(ordered_items):
            current_item.position = index
    else:
        normalize_positions(db, item.task_id)

    db.commit()
    db.refresh(item)

    create_log(
        db=db,
        entity_type="task",
        entity_id=item.task_id,
        action=action,
        old_value=old_value,
        new_value={
            "item_id": str(item.id),
            "title": item.title,
            "is_done": item.is_done,
            "position": item.position,
            "assignee_id": str(item.assignee_id) if item.assignee_id else None,
            "due_date": item.due_date.isoformat() if item.due_date else None,
        },
        user_id=current_user.id,
    )

    return item


def delete_checklist_item(db: Session, item_id: UUID, current_user):
    try:
        item = (
            db.query(TaskChecklistItem)
            .filter(TaskChecklistItem.id == item_id, TaskChecklistItem.deleted_at.is_(None))
            .first()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Checklist migration has not been applied")

    if not item:
        return None

    item.deleted_at = datetime.now(timezone.utc)
    normalize_positions(db, item.task_id)
    db.commit()

    create_log(
        db=db,
        entity_type="task",
        entity_id=item.task_id,
        action="checklist_item_deleted",
        old_value={"item_id": str(item.id), "title": item.title},
        user_id=current_user.id,
    )

    return item
