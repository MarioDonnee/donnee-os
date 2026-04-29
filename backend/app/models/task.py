from sqlalchemy import Column, String, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
import uuid

from app.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text)

    status = Column(String, nullable=False, default="BACKLOG")
    priority = Column(String, nullable=False, default="MEDIUM")
    position = Column(Integer, nullable=False, default=0)

    assignee_id = Column(UUID(as_uuid=True))

    start_date = Column(Date)
    due_date = Column(Date)
    completed_at = Column(DateTime(timezone=True))

    created_by = Column(UUID(as_uuid=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
