from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.activity_log import ActivityLog
from app.models.client import Client
from app.models.project import Project
from app.models.task import Task
from app.models.user import User


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

    overdue_rows = (
        db.query(Task, Project.name)
        .join(Project, Task.project_id == Project.id)
        .filter(
            Task.deleted_at.is_(None),
            Task.status.notin_(["DONE", "CANCELLED"]),
            Task.due_date < date.today(),
        )
        .order_by(Task.due_date.asc())
        .limit(5)
        .all()
    )

    overdue_tasks_list = [
        {
            "id": str(task.id),
            "title": task.title,
            "project_name": project_name,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        }
        for task, project_name in overdue_rows
    ]

    activity_rows = (
        db.query(ActivityLog, User.name)
        .outerjoin(User, ActivityLog.performed_by == User.id)
        .order_by(ActivityLog.performed_at.desc())
        .limit(10)
        .all()
    )

    recent_activity = [
        {
            "id": str(log.id),
            "entity_type": log.entity_type,
            "action": log.action,
            "performed_by_name": user_name,
            "performed_at": log.performed_at.isoformat() if log.performed_at else None,
        }
        for log, user_name in activity_rows
    ]

    return {
        "total_clients": total_clients,
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "done_tasks": done_tasks,
        "overdue_tasks": overdue_tasks,
        "tasks_by_status": tasks_by_status,
        "tasks_by_priority": tasks_by_priority,
        "overdue_tasks_list": overdue_tasks_list,
        "recent_activity": recent_activity,
    }
