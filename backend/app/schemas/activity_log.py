from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    old_value: dict[str, Any] | None
    new_value: dict[str, Any] | None
    performed_by: UUID | None
    performed_at: datetime | None

    class Config:
        from_attributes = True
