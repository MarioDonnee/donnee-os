from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class TaskCreate(BaseModel):
    project_id: UUID
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    position: int
    due_date: Optional[date]

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[UUID] = None
    due_date: Optional[date] = None


class TaskMove(BaseModel):
    status: str
    position: int
