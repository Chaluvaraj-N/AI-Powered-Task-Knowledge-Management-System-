import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class RoleName(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


# ---------------------------------------------------------------------------
# roles
# ---------------------------------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(RoleName), unique=True, nullable=False, index=True)

    users = relationship("User", back_populates="role")


# ---------------------------------------------------------------------------
# users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    documents = relationship("Document", back_populates="uploaded_by")
    tasks_assigned = relationship(
        "Task", back_populates="assignee", foreign_keys="Task.assigned_to_id"
    )
    tasks_created = relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by_id"
    )
    activity_logs = relationship("ActivityLog", back_populates="user")
    search_queries = relationship("SearchQuery", back_populates="user")


# ---------------------------------------------------------------------------
# documents
# ---------------------------------------------------------------------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf / txt
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    indexed = Column(Boolean, default=False)  # whether embeddings were built

    uploaded_by = relationship("User", back_populates="documents")
    chunks = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# document_chunks  (maps a chunk of text -> row index inside the FAISS index)
# ---------------------------------------------------------------------------
class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    vector_row_id = Column(Integer, nullable=False, unique=True)  # position in FAISS index

    document = relationship("Document", back_populates="chunks")


# ---------------------------------------------------------------------------
# tasks
# ---------------------------------------------------------------------------
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to_id])
    creator = relationship("User", back_populates="tasks_created", foreign_keys=[created_by_id])


# ---------------------------------------------------------------------------
# activity_logs
# ---------------------------------------------------------------------------
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False, index=True)  # login, task_update, document_upload, search
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="activity_logs")


# ---------------------------------------------------------------------------
# search_queries  (used for "most searched queries" analytics)
# ---------------------------------------------------------------------------
class SearchQuery(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query_text = Column(String(500), nullable=False, index=True)
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="search_queries")
