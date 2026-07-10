from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import hash_password
from app.models.models import User, Role, RoleName
from app.schemas.schemas import UserOut, RegisterRequest
from app.api.deps import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Any authenticated user can view the list (needed for admin's task-assignment
    # dropdown); regular users only get a read-only view.
    users = db.query(User).all()
    return [UserOut.from_orm_user(u) for u in users]


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = db.query(Role).filter(Role.name == payload.role).first()
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_user(user)
