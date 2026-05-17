from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


class ProjectCreate(BaseModel):
    client_id: UUID
    name: str
    description: Optional[str] = None
    status: str = "DISCOVERY"
    owner_id: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    priority: str = "MEDIUM"
    health_score: Optional[int] = None
    created_by: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    client_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    health_score: Optional[int] = None


class ProjectResponse(BaseModel):
    id: UUID
    client_id: UUID
    name: str
    description: Optional[str]
    status: str
    owner_id: Optional[UUID]
    start_date: Optional[date]
    due_date: Optional[date]
    priority: str
    health_score: Optional[int]
    risk_status: str = "HEALTHY"

    class Config:
        from_attributes = True
