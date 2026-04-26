from uuid import UUID

from sqlalchemy.orm import Session

from app.models.task import Task


def create_task(db: Session, data):
    task = Task(**data.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session):
    return db.query(Task).all()


def get_tasks_by_project(db: Session, project_id: UUID):
    return db.query(Task).filter(Task.project_id == project_id).all()


def update_task(db: Session, task_id: UUID, data):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        return None

    update_data = data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task
