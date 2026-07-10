from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ActivityLog, User
from app.schemas.schemas import ActivityLogOut
from app.api.deps import require_admin

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.get("/", response_model=List[ActivityLogOut])
def list_activity_logs(
    db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
        .all()
    )
