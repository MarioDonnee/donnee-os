from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.client import Client
from app.models.project import Project
from app.models.task import Task


def get_dashboard_summary(db: Session):
    total_clients = (
        db.query(Client)
        .filter(Client.deleted_at.is_(None))
        .count()
    )

    total_projects = (
        db.query(Project)
        .filter(Project.deleted_at.is_(None))
        .count()
    )

    total_tasks = (
        db.query(Task)
        .filter(Task.deleted_at.is_(None))
        .count()
    )

    done_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status == "DONE",
        )
        .count()
    )

    open_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status.notin_(["DONE", "CANCELLED"]),
        )
        .count()
    )

    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status.notin_(["DONE", "CANCELLED"]),
            Task.due_date < date.today(),
        )
        .count()
    )

    tasks_by_status_rows = (
        db.query(Task.status, func.count(Task.id))
        .filter(Task.deleted_at.is_(None))
        .group_by(Task.status)
        .all()
    )

    tasks_by_priority_rows = (
        db.query(Task.priority, func.count(Task.id))
        .filter(Task.deleted_at.is_(None))
        .group_by(Task.priority)
        .all()
    )

    tasks_by_status = {
        status: count for status, count in tasks_by_status_rows
    }

    tasks_by_priority = {
        priority: count for priority, count in tasks_by_priority_rows
    }

    return {
        "total_clients": total_clients,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "done_tasks": done_tasks,
        "overdue_tasks": overdue_tasks,
        "tasks_by_status": tasks_by_status,
        "tasks_by_priority": tasks_by_priority,
    }
