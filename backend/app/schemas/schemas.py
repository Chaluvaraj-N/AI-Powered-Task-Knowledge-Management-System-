from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.models import TaskStatus, RoleName


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: RoleName = RoleName.USER


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: RoleName
    is_active: bool

    @classmethod
    def from_orm_user(cls, user):
        return cls(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role.name,
            is_active=user.is_active,
        )


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    filename: str
    file_type: str
    uploaded_at: datetime
    indexed: bool
    uploaded_by_id: int


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to_id: int


class TaskUpdateStatus(BaseModel):
    status: TaskStatus


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    assigned_to_id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------
class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = None


class SearchResultItem(BaseModel):
    document_id: int
    document_title: str
    chunk_text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
class TopQuery(BaseModel):
    query_text: str
    count: int


class AnalyticsResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_documents: int
    total_users: int
    total_searches: int
    most_searched_queries: List[TopQuery]


# ---------------------------------------------------------------------------
# Activity Logs
# ---------------------------------------------------------------------------
class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int]
    action: str
    details: Optional[str]
    created_at: datetime


TokenResponse.model_rebuild()
