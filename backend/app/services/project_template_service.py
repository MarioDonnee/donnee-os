from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.project import Project
from app.models.project_template import ProjectTemplate, ProjectTemplateTask
from app.models.task import Task
from app.services.activity_log_service import create_log
from app.services.task_service import attach_checklist_counts_to_tasks, attach_labels_to_tasks


def attach_tasks_to_templates(db: Session, templates: list[ProjectTemplate]) -> list[ProjectTemplate]:
    if not templates:
        return templates

    template_ids = [template.id for template in templates]
    rows = (
        db.query(ProjectTemplateTask)
        .filter(ProjectTemplateTask.template_id.in_(template_ids))
        .order_by(ProjectTemplateTask.position.asc(), ProjectTemplateTask.created_at.asc())
        .all()
    )
    tasks_by_template_id = {template_id: [] for template_id in template_ids}

    for task in rows:
        tasks_by_template_id.setdefault(task.template_id, []).append(task)

    for template in templates:
        template.tasks = tasks_by_template_id.get(template.id, [])

    return templates


def get_project_templates(db: Session) -> list[ProjectTemplate]:
    templates = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.is_active.is_(True), ProjectTemplate.deleted_at.is_(None))
        .order_by(ProjectTemplate.name.asc())
        .all()
    )
    return attach_tasks_to_templates(db, templates)


def get_project_template_by_id(db: Session, template_id: UUID) -> ProjectTemplate | None:
    template = (
        db.query(ProjectTemplate)
        .filter(
            ProjectTemplate.id == template_id,
            ProjectTemplate.is_active.is_(True),
            ProjectTemplate.deleted_at.is_(None),
        )
        .first()
    )

    if template:
        attach_tasks_to_templates(db, [template])

    return template


def create_project_from_template(db: Session, data, current_user=None) -> dict:
    client = (
        db.query(Client)
        .filter(Client.id == data.client_id, Client.deleted_at.is_(None))
        .first()
    )

    if not client:
        raise HTTPException(status_code=400, detail="Client does not exist")

    template = get_project_template_by_id(db, data.template_id)

    if not template:
        raise HTTPException(status_code=400, detail="Project template does not exist")

    base_date = data.start_date or date.today()
    project_due_date = data.due_date or (base_date + timedelta(days=template.estimated_days))

    try:
        project = Project(
            client_id=data.client_id,
            name=data.name,
            description=data.description or template.description,
            status="PLANNING",
            owner_id=data.owner_id,
            start_date=data.start_date,
            due_date=project_due_date,
            priority="MEDIUM",
            health_score=80,
            created_by=current_user.id if current_user else None,
        )
        db.add(project)
        db.flush()

        created_tasks: list[Task] = []
        for template_task in template.tasks:
            task_due_date = None
            if template_task.due_offset_days is not None:
                task_due_date = base_date + timedelta(days=template_task.due_offset_days)

            task = Task(
                project_id=project.id,
                title=template_task.title,
                description=template_task.description,
                status=template_task.status,
                priority=template_task.priority,
                position=template_task.position,
                due_date=task_due_date,
                created_by=current_user.id if current_user else None,
            )
            db.add(task)
            db.flush()
            created_tasks.append(task)

        create_log(
            db=db,
            entity_type="project",
            entity_id=project.id,
            action="created_from_template",
            new_value={
                "template_id": str(template.id),
                "template_name": template.name,
                "task_count": len(created_tasks),
            },
            user_id=current_user.id if current_user else None,
            commit=False,
        )

        for task in created_tasks:
            create_log(
                db=db,
                entity_type="task",
                entity_id=task.id,
                action="created_from_template",
                new_value={
                    "project_id": str(project.id),
                    "template_id": str(template.id),
                    "title": task.title,
                    "position": task.position,
                },
                user_id=current_user.id if current_user else None,
                commit=False,
            )

        db.commit()
        db.refresh(project)

        for task in created_tasks:
            db.refresh(task)

        attach_labels_to_tasks(db, created_tasks)
        attach_checklist_counts_to_tasks(db, created_tasks)

        return {"project": project, "tasks": created_tasks, "created_at": project.created_at}
    except Exception:
        db.rollback()
        raise
