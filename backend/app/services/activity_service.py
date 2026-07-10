from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import ActivityLog


def log_activity(db: Session, user_id: Optional[int], action: str, details: str = ""):
    entry = ActivityLog(user_id=user_id, action=action, details=details)
    db.add(entry)
    db.commit()
    return entry
