from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class TaskCommentCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_must_not_be_blank(cls, value: str):
        body = value.strip()

        if not body:
            raise ValueError("Comment body is required")

        return body


class TaskCommentUpdate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_must_not_be_blank(cls, value: str):
        body = value.strip()

        if not body:
            raise ValueError("Comment body is required")

        return body


class TaskCommentResponse(BaseModel):
    id: UUID
    task_id: UUID
    body: str
    created_by: UUID
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True
