from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date, datetime

from app.schemas.label import LabelResponse


class TaskCreate(BaseModel):
    project_id: UUID
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    position: int
    assignee_id: Optional[UUID]
    start_date: Optional[date]
    due_date: Optional[date]
    completed_at: Optional[datetime]
    created_by: Optional[UUID]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    labels: list[LabelResponse] = Field(default_factory=list)
    checklist_total: int = 0
    checklist_done: int = 0

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None


class TaskMove(BaseModel):
    status: str
    position: int
