from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import (
    create_project,
    get_projects,
    get_project_by_id,
    update_project,
)

router = APIRouter()


@router.post("", response_model=ProjectResponse)
def create(project: ProjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_project(db, project, current_user)


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    client_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_projects(db, client_id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_one(project_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = get_project_by_id(db, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update(project_id: UUID, project: ProjectUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated_project = update_project(db, project_id, project)

    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")

    return updated_project
