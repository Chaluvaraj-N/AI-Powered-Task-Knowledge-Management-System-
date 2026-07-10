from sqlalchemy.orm import Session

from app.db.session import Base, engine, SessionLocal
from app.models import models  # noqa: F401  ensures models are registered on Base
from app.models.models import Role, RoleName, User
from app.core.security import hash_password


def init_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        _seed_roles(db)
        _seed_default_users(db)
    finally:
        db.close()


def _seed_roles(db: Session):
    for role_name in RoleName:
        exists = db.query(Role).filter(Role.name == role_name).first()
        if not exists:
            db.add(Role(name=role_name))
    db.commit()


def _seed_default_users(db: Session):
    admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN).first()
    user_role = db.query(Role).filter(Role.name == RoleName.USER).first()

    if not db.query(User).filter(User.email == "admin@company.com").first():
        db.add(
            User(
                full_name="System Admin",
                email="admin@company.com",
                hashed_password=hash_password("Admin@123"),
                role_id=admin_role.id,
            )
        )

    if not db.query(User).filter(User.email == "user@company.com").first():
        db.add(
            User(
                full_name="Demo User",
                email="user@company.com",
                hashed_password=hash_password("User@123"),
                role_id=user_role.id,
            )
        )
    db.commit()
