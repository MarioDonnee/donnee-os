from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from app.models.base import Base


class TaskLabel(Base):
    __tablename__ = "task_labels"

    task_id = Column(UUID(as_uuid=True), primary_key=True)
    label_id = Column(UUID(as_uuid=True), primary_key=True)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
