from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.models.models import User, Role, RoleName
from app.schemas.schemas import LoginRequest, TokenResponse, UserOut, RegisterRequest
from app.services.activity_service import log_activity
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token(subject=str(user.id), role=user.role.name.value)
    log_activity(db, user.id, "login", f"{user.email} logged in")

    return TokenResponse(access_token=token, user=UserOut.from_orm_user(user))


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Self-service registration. New accounts are created with the 'user' role by
    default; only an already-authenticated admin can create additional admins
    (see /users/ POST route).
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = db.query(Role).filter(Role.name == RoleName.USER).first()
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


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.from_orm_user(current_user)
