from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.task_comment import TaskComment
from app.services.activity_log_service import create_log
from app.services.notification_service import create_notification
from app.services.task_service import get_task_by_id


def get_comments_by_task(db: Session, task_id: UUID):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id, TaskComment.deleted_at.is_(None))
        .order_by(TaskComment.created_at.asc())
        .all()
    )


def create_comment(db: Session, task_id: UUID, data, current_user):
    task = get_task_by_id(db, task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = TaskComment(
        task_id=task_id,
        body=data.body,
        created_by=current_user.id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    create_log(
        db=db,
        entity_type="task",
        entity_id=task_id,
        action="comment_created",
        new_value={"comment_id": str(comment.id), "body": comment.body},
        user_id=current_user.id,
    )

    if task.assignee_id and task.assignee_id != current_user.id:
        create_notification(
            db=db,
            user_id=task.assignee_id,
            type="task_comment",
            title="Novo comentário",
            body=f'Novo comentário na tarefa "{task.title}"',
            entity_type="task",
            entity_id=task_id,
        )

    return comment


def update_comment(db: Session, comment_id: UUID, data, current_user):
    comment = (
        db.query(TaskComment)
        .filter(TaskComment.id == comment_id, TaskComment.deleted_at.is_(None))
        .first()
    )

    if not comment:
        return None

    old_value = {"body": comment.body}
    comment.body = data.body

    db.commit()
    db.refresh(comment)

    create_log(
        db=db,
        entity_type="task",
        entity_id=comment.task_id,
        action="comment_updated",
        old_value=old_value,
        new_value={"comment_id": str(comment.id), "body": comment.body},
        user_id=current_user.id,
    )

    return comment


def delete_comment(db: Session, comment_id: UUID, current_user):
    comment = (
        db.query(TaskComment)
        .filter(TaskComment.id == comment_id, TaskComment.deleted_at.is_(None))
        .first()
    )

    if not comment:
        return None

    comment.deleted_at = datetime.now(timezone.utc)
    db.commit()

    create_log(
        db=db,
        entity_type="task",
        entity_id=comment.task_id,
        action="comment_deleted",
        old_value={"comment_id": str(comment.id), "body": comment.body},
        user_id=current_user.id,
    )

    return comment
