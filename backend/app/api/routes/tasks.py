from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Task, User, TaskStatus, RoleName
from app.schemas.schemas import TaskCreate, TaskOut, TaskUpdateStatus
from app.api.deps import require_admin, get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    assignee = db.query(User).filter(User.id == payload.assigned_to_id).first()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    task = Task(
        title=payload.title,
        description=payload.description,
        assigned_to_id=payload.assigned_to_id,
        created_by_id=admin.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_activity(
        db, admin.id, "task_create",
        f"Created task '{task.title}' assigned to user id={assignee.id}",
    )
    return task


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    status_filter: Optional[TaskStatus] = Query(default=None, alias="status"),
    assigned_to: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dynamic filtering API.
      /tasks?status=completed
      /tasks?assigned_to=1
      /tasks?status=pending&assigned_to=3

    RBAC: regular users only ever see their own tasks; admins see everything
    (optionally narrowed by the same filters).
    """
    query = db.query(Task)

    if current_user.role.name == RoleName.USER:
        query = query.filter(Task.assigned_to_id == current_user.id)
    elif assigned_to is not None:
        query = query.filter(Task.assigned_to_id == assigned_to)

    if status_filter is not None:
        query = query.filter(Task.status == status_filter)

    return query.order_by(Task.created_at.desc()).all()


@router.patch("/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: int,
    payload: TaskUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # RBAC: a regular user may only update tasks assigned to them; admin can update any.
    if current_user.role.name == RoleName.USER and task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own tasks")

    task.status = payload.status
    db.commit()
    db.refresh(task)

    log_activity(
        db, current_user.id, "task_update",
        f"Task id={task.id} status changed to {payload.status.value}",
    )
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    log_activity(db, admin.id, "task_delete", f"Deleted task id={task_id}")
    return None
