import uuid

from sqlalchemy import Boolean, Column, Date, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from app.models.base import Base


class TaskChecklistItem(Base):
    __tablename__ = "task_checklist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String, nullable=False)
    is_done = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False, default=0)
    assignee_id = Column(UUID(as_uuid=True))
    due_date = Column(Date)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))
