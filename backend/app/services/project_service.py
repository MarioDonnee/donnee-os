from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.project import Project
from app.models.client import Client
from app.services.activity_log_service import create_log


def create_project(db: Session, data, current_user=None):
    client = (
        db.query(Client)
        .filter(Client.id == data.client_id, Client.deleted_at.is_(None))
        .first()
    )

    if not client:
        raise HTTPException(status_code=400, detail="Client does not exist")

    project_data = data.model_dump()

    if current_user:
        project_data["created_by"] = current_user.id

    project = Project(**project_data)
    db.add(project)
    db.commit()
    db.refresh(project)

    create_log(
        db=db,
        entity_type="project",
        entity_id=project.id,
        action="created",
        new_value=data.model_dump(mode="json"),
        user_id=current_user.id if current_user else None,
    )

    return project


def get_projects(db: Session, client_id: UUID | None = None):
    query = db.query(Project).filter(Project.deleted_at.is_(None))

    if client_id:
        query = query.filter(Project.client_id == client_id)

    return query.all()


def get_project_by_id(db: Session, project_id: UUID):
    return (
        db.query(Project)
        .filter(Project.id == project_id, Project.deleted_at.is_(None))
        .first()
    )


def update_project(db: Session, project_id: UUID, data, current_user=None):
    project = get_project_by_id(db, project_id)

    if not project:
        return None

    update_data = data.model_dump(exclude_unset=True)

    old_value = {
        "client_id": str(project.client_id) if project.client_id else None,
        "name": project.name,
        "status": project.status,
        "priority": project.priority,
        "health_score": project.health_score,
    }

    if "client_id" in update_data:
        client = (
            db.query(Client)
            .filter(Client.id == update_data["client_id"], Client.deleted_at.is_(None))
            .first()
        )

        if not client:
            raise HTTPException(status_code=400, detail="Client does not exist")

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    create_log(
        db=db,
        entity_type="project",
        entity_id=project.id,
        action="updated",
        old_value=old_value,
        new_value=data.model_dump(mode="json", exclude_unset=True),
        user_id=current_user.id if current_user else None,
    )

    return project
