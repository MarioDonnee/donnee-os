from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.activity_log import ActivityLog
from app.models.client import Client
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.services.risk_service import get_risk_status


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

    blocked_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status == "BLOCKED",
        )
        .count()
    )

    urgent_open_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status.notin_(["DONE", "CANCELLED"]),
            Task.priority == "URGENT",
        )
        .count()
    )

    due_today_tasks = (
        db.query(Task)
        .filter(
            Task.deleted_at.is_(None),
            Task.status.notin_(["DONE", "CANCELLED"]),
            Task.due_date == date.today(),
        )
        .count()
    )

    projects_at_risk = (
        db.query(Project)
        .filter(
            Project.deleted_at.is_(None),
            Project.status.notin_(["DELIVERED", "CANCELLED"]),
            Project.health_score < 60,
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

    risk_project_rows = (
        db.query(Project)
        .filter(
            Project.deleted_at.is_(None),
            Project.status.notin_(["DELIVERED", "CANCELLED"]),
            Project.health_score < 60,
        )
        .order_by(Project.health_score.asc(), Project.due_date.asc().nullslast())
        .limit(5)
        .all()
    )

    risk_projects = [
        {
            "id": str(project.id),
            "name": project.name,
            "health_score": project.health_score,
            "risk_status": get_risk_status(project.health_score),
            "due_date": project.due_date.isoformat() if project.due_date else None,
        }
        for project in risk_project_rows
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
        "blocked_tasks": blocked_tasks,
        "urgent_open_tasks": urgent_open_tasks,
        "due_today_tasks": due_today_tasks,
        "projects_at_risk": projects_at_risk,
        "tasks_by_status": tasks_by_status,
        "tasks_by_priority": tasks_by_priority,
        "overdue_tasks_list": overdue_tasks_list,
        "risk_projects": risk_projects,
        "recent_activity": recent_activity,
    }
