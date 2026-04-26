from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog


def create_log(
    db: Session,
    entity_type: str,
    entity_id,
    action: str,
    old_value=None,
    new_value=None,
    user_id=None,
):
    log = ActivityLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        performed_by=user_id,
    )

    db.add(log)
    db.commit()
