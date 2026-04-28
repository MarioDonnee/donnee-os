from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session

from app.models.label import Label
from app.models.task_label import TaskLabel
from app.services.activity_log_service import create_log
from app.services.task_service import get_task_by_id, attach_labels_to_task


def get_labels(db: Session):
    try:
        return (
            db.query(Label)
            .filter(Label.deleted_at.is_(None))
            .order_by(Label.name.asc())
            .all()
        )
    except ProgrammingError:
        db.rollback()
        return []


def create_label(db: Session, data, current_user):
    label = Label(
        name=data.name,
        color=data.color,
        created_by=current_user.id,
    )

    db.add(label)
    try:
        db.commit()
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Labels migration has not been applied")

    db.refresh(label)

    create_log(
        db=db,
        entity_type="label",
        entity_id=label.id,
        action="created",
        new_value={"name": label.name, "color": label.color},
        user_id=current_user.id,
    )

    return label


def attach_label_to_task(db: Session, task_id: UUID, label_id: UUID, current_user):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        label = (
            db.query(Label)
            .filter(Label.id == label_id, Label.deleted_at.is_(None))
            .first()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Labels migration has not been applied")

    if not label:
        raise HTTPException(status_code=404, detail="Label not found")

    try:
        existing_task_label = (
            db.query(TaskLabel)
            .filter(TaskLabel.task_id == task_id, TaskLabel.label_id == label_id)
            .first()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Labels migration has not been applied")

    if not existing_task_label:
        task_label = TaskLabel(
            task_id=task_id,
            label_id=label_id,
            created_by=current_user.id,
        )
        db.add(task_label)
        try:
            db.commit()
        except ProgrammingError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Labels migration has not been applied")

        create_log(
            db=db,
            entity_type="task",
            entity_id=task_id,
            action="label_attached",
            new_value={"label_id": str(label.id), "name": label.name},
            user_id=current_user.id,
        )

    return attach_labels_to_task(db, task)


def detach_label_from_task(db: Session, task_id: UUID, label_id: UUID, current_user):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        task_label = (
            db.query(TaskLabel)
            .filter(TaskLabel.task_id == task_id, TaskLabel.label_id == label_id)
            .first()
        )
    except ProgrammingError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Labels migration has not been applied")

    if not task_label:
        raise HTTPException(status_code=404, detail="Task label not found")

    label = (
        db.query(Label)
        .filter(Label.id == label_id)
        .first()
    )

    db.delete(task_label)
    db.commit()

    create_log(
        db=db,
        entity_type="task",
        entity_id=task_id,
        action="label_detached",
        old_value={
            "label_id": str(label_id),
            "name": label.name if label else None,
        },
        user_id=current_user.id,
    )

    return attach_labels_to_task(db, task)
