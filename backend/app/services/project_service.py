from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.project import Project
from app.models.client import Client


def create_project(db: Session, data):
    client = (
        db.query(Client)
        .filter(Client.id == data.client_id, Client.deleted_at.is_(None))
        .first()
    )

    if not client:
        raise HTTPException(status_code=400, detail="Client does not exist")

    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
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


def update_project(db: Session, project_id: UUID, data):
    project = get_project_by_id(db, project_id)

    if not project:
        return None

    update_data = data.model_dump(exclude_unset=True)

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
    return project