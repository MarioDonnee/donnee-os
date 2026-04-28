from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class LabelCreate(BaseModel):
    name: str
    color: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str):
        name = value.strip()

        if not name:
            raise ValueError("Label name is required")

        return name

    @field_validator("color")
    @classmethod
    def color_must_not_be_blank(cls, value: str):
        color = value.strip()

        if not color:
            raise ValueError("Label color is required")

        return color


class LabelResponse(BaseModel):
    id: UUID
    name: str
    color: str
    created_by: UUID | None
    created_at: datetime | None

    class Config:
        from_attributes = True


class TaskLabelAttach(BaseModel):
    label_id: UUID
