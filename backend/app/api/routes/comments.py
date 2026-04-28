from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.schemas.task_comment import (
    TaskCommentCreate,
    TaskCommentResponse,
    TaskCommentUpdate,
)
from app.services.task_comment_service import (
    create_comment,
    delete_comment,
    get_comments_by_task,
    update_comment,
)

router = APIRouter()


@router.get("/tasks/{task_id}/comments", response_model=list[TaskCommentResponse])
def list_comments(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST", "VIEWER")),
):
    return get_comments_by_task(db, task_id)


@router.post("/tasks/{task_id}/comments", response_model=TaskCommentResponse)
def create(
    task_id: UUID,
    comment: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    return create_comment(db, task_id, comment, current_user)


@router.patch("/comments/{comment_id}", response_model=TaskCommentResponse)
def update(
    comment_id: UUID,
    comment: TaskCommentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    updated_comment = update_comment(db, comment_id, comment, current_user)

    if not updated_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    return updated_comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER", "ANALYST")),
):
    deleted_comment = delete_comment(db, comment_id, current_user)

    if not deleted_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    return Response(status_code=204)
