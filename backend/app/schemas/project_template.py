from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.project import ProjectResponse
from app.schemas.task import TaskResponse


class ProjectTemplateTaskResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    status: str
    priority: str
    position: int
    due_offset_days: int | None

    class Config:
        from_attributes = True


class ProjectTemplateResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    service_type: str
    estimated_days: int
    tasks: list[ProjectTemplateTaskResponse]

    class Config:
        from_attributes = True


class ProjectFromTemplateCreate(BaseModel):
    client_id: UUID
    template_id: UUID
    name: str
    description: str | None = None
    start_date: date | None = None
    due_date: date | None = None
    owner_id: UUID | None = None


class ProjectFromTemplateResponse(BaseModel):
    project: ProjectResponse
    tasks: list[TaskResponse]
    created_at: datetime | None = None
