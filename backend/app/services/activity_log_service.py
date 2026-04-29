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
    commit: bool = True,
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
    if commit:
        db.commit()


def get_logs_for_entity(db: Session, entity_type: str, entity_id):
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == entity_id)
        .order_by(ActivityLog.performed_at.desc())
        .all()
    )
