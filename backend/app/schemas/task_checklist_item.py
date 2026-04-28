from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class ChecklistItemCreate(BaseModel):
    title: str
    assignee_id: UUID | None = None
    due_date: date | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str):
        title = value.strip()

        if not title:
            raise ValueError("Checklist item title is required")

        return title


class ChecklistItemUpdate(BaseModel):
    title: str | None = None
    is_done: bool | None = None
    position: int | None = None
    assignee_id: UUID | None = None
    due_date: date | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None):
        if value is None:
            return value

        title = value.strip()

        if not title:
            raise ValueError("Checklist item title is required")

        return title


class ChecklistItemResponse(BaseModel):
    id: UUID
    task_id: UUID
    title: str
    is_done: bool
    position: int
    assignee_id: UUID | None
    due_date: date | None
    created_by: UUID
    created_at: datetime | None
    updated_at: datetime | None
    completed_at: datetime | None

    class Config:
        from_attributes = True
