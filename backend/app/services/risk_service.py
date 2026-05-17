from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.project import Project
from app.models.task import Task
from app.services.activity_log_service import create_log
from app.services.notification_service import create_notification

INACTIVE_TASK_STATUSES = {"DONE", "CANCELLED"}


def calculate_due_status(task: Task, today: date | None = None) -> str:
    current_date = today or date.today()

    if task.status == "DONE":
        return "COMPLETED"

    if not task.due_date:
        return "NO_DATE"

    days_until_due = (task.due_date - current_date).days

    if task.status not in INACTIVE_TASK_STATUSES and days_until_due < 0:
        return "OVERDUE"

    if days_until_due == 0:
        return "DUE_TODAY"

    if 0 < days_until_due <= 3:
        return "DUE_SOON"

    return "UPCOMING"


def attach_due_status_to_task(task: Task) -> Task:
    task.due_status = calculate_due_status(task)
    return task


def attach_due_status_to_tasks(tasks: list[Task]) -> list[Task]:
    for task in tasks:
        attach_due_status_to_task(task)
    return tasks


def get_risk_status(health_score: int | None) -> str:
    score = 100 if health_score is None else health_score

    if score >= 80:
        return "HEALTHY"
    if score >= 60:
        return "ATTENTION"
    if score >= 40:
        return "AT_RISK"
    return "CRITICAL"


def attach_risk_status_to_project(project: Project) -> Project:
    project.risk_status = get_risk_status(project.health_score)
    return project


def attach_risk_status_to_projects(projects: list[Project]) -> list[Project]:
    for project in projects:
        attach_risk_status_to_project(project)
    return projects


def calculate_project_health_score(db: Session, project: Project) -> int:
    tasks = (
        db.query(Task)
        .filter(Task.project_id == project.id, Task.deleted_at.is_(None))
        .all()
    )

    if not tasks:
        return 90 if project.status not in {"CANCELLED"} else 80

    open_tasks = [task for task in tasks if task.status not in INACTIVE_TASK_STATUSES]
    done_tasks = [task for task in tasks if task.status == "DONE"]
    score = 100
    today = date.today()

    overdue_count = sum(1 for task in open_tasks if task.due_date and task.due_date < today)
    blocked_count = sum(1 for task in open_tasks if task.status == "BLOCKED")
    urgent_count = sum(1 for task in open_tasks if task.priority == "URGENT")
    completion_ratio = len(done_tasks) / len(tasks)

    score -= min(overdue_count * 12, 36)
    score -= min(blocked_count * 10, 30)
    score -= min(urgent_count * 6, 18)

    if project.due_date and project.status not in {"DELIVERED", "CANCELLED"}:
        days_until_project_due = (project.due_date - today).days

        if days_until_project_due < 0 and open_tasks:
            score -= 20
        elif 0 <= days_until_project_due <= 7 and completion_ratio < 0.7:
            score -= 12

    if project.status == "DELIVERED" and not open_tasks:
        score = max(score, 92)

    if not open_tasks:
        score = max(score, 88)

    return max(0, min(100, score))


def recalculate_project_health(
    db: Session,
    project_id: UUID,
    current_user=None,
) -> Project | None:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.deleted_at.is_(None))
        .first()
    )

    if not project:
        return None

    old_score = project.health_score
    new_score = calculate_project_health_score(db, project)
    project.health_score = new_score
    db.commit()
    db.refresh(project)
    attach_risk_status_to_project(project)

    if old_score != new_score:
        create_log(
            db=db,
            entity_type="project",
            entity_id=project.id,
            action="health_score_recalculated",
            old_value={"health_score": old_score},
            new_value={"health_score": new_score, "risk_status": project.risk_status},
            user_id=current_user.id if current_user else None,
        )

    return project


def _should_notify(task: Task, current_user) -> bool:
    return bool(task.assignee_id and (current_user is None or task.assignee_id != current_user.id))


def _create_notification_once(
    db: Session,
    *,
    user_id: UUID,
    type: str,
    title: str,
    body: str,
    entity_type: str,
    entity_id: UUID,
):
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == type,
            Notification.entity_type == entity_type,
            Notification.entity_id == entity_id,
        )
        .first()
    )

    if existing:
        return existing

    return create_notification(
        db=db,
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        entity_type=entity_type,
        entity_id=entity_id,
    )


def handle_task_automations(
    db: Session,
    task: Task,
    *,
    old_status: str | None = None,
    old_priority: str | None = None,
    old_due_status: str | None = None,
    current_user=None,
):
    current_due_status = calculate_due_status(task)

    if _should_notify(task, current_user):
        if task.priority == "URGENT" and old_priority != "URGENT":
            _create_notification_once(
                db=db,
                user_id=task.assignee_id,
                type="task_urgent",
                title="Tarefa marcada como urgente",
                body=f'A tarefa "{task.title}" agora está como urgente.',
                entity_type="task",
                entity_id=task.id,
            )

        if task.status == "REVIEW" and old_status != "REVIEW":
            _create_notification_once(
                db=db,
                user_id=task.assignee_id,
                type="task_review",
                title="Tarefa pronta para revisão",
                body=f'A tarefa "{task.title}" entrou em revisão.',
                entity_type="task",
                entity_id=task.id,
            )

        if current_due_status == "OVERDUE" and old_due_status != "OVERDUE":
            _create_notification_once(
                db=db,
                user_id=task.assignee_id,
                type="task_overdue",
                title="Tarefa em atraso",
                body=f'A tarefa "{task.title}" passou do prazo.',
                entity_type="task",
                entity_id=task.id,
            )

    recalculate_project_health(db, task.project_id, current_user=current_user)
    attach_due_status_to_task(task)
