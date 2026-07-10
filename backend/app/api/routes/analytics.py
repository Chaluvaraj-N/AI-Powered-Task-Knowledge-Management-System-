from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Task, TaskStatus, Document, User, SearchQuery
from app.schemas.schemas import AnalyticsResponse, TopQuery
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    completed_tasks = (
        db.query(func.count(Task.id)).filter(Task.status == TaskStatus.COMPLETED).scalar() or 0
    )
    pending_tasks = (
        db.query(func.count(Task.id)).filter(Task.status == TaskStatus.PENDING).scalar() or 0
    )
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_searches = db.query(func.count(SearchQuery.id)).scalar() or 0

    top_queries_raw = (
        db.query(SearchQuery.query_text, func.count(SearchQuery.id).label("cnt"))
        .group_by(SearchQuery.query_text)
        .order_by(func.count(SearchQuery.id).desc())
        .limit(10)
        .all()
    )
    most_searched = [TopQuery(query_text=q, count=c) for q, c in top_queries_raw]

    return AnalyticsResponse(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        total_documents=total_documents,
        total_users=total_users,
        total_searches=total_searches,
        most_searched_queries=most_searched,
    )
