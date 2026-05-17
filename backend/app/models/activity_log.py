from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime
import uuid

from app.models.base import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    action = Column(String, nullable=False)

    old_value = Column(JSONB)
    new_value = Column(JSONB)

    performed_by = Column(UUID(as_uuid=True))

    performed_at = Column(DateTime(timezone=True), server_default=func.now())
