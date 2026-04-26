from sqlalchemy import Column, String, Text, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
import uuid

from app.models.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    client_id = Column(UUID(as_uuid=True), nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text)

    status = Column(String, nullable=False, default="DISCOVERY")
    owner_id = Column(UUID(as_uuid=True))

    start_date = Column(Date)
    due_date = Column(Date)

    priority = Column(String, nullable=False, default="MEDIUM")
    health_score = Column(Integer)

    created_by = Column(UUID(as_uuid=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
