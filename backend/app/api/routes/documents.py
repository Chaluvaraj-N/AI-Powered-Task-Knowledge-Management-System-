import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.models.models import Document, User
from app.schemas.schemas import DocumentOut
from app.api.deps import require_admin, get_current_user
from app.services.document_service import index_document
from app.services.activity_service import log_activity

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {"txt", "pdf"}


@router.post("/", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported")

    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    dest_path = settings.UPLOAD_DIR / safe_name

    with dest_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = Document(
        title=file.filename,
        filename=safe_name,
        file_path=str(dest_path),
        file_type=ext,
        uploaded_by_id=admin.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Core AI step: extract text -> chunk -> embed -> store in FAISS
    chunks_indexed = index_document(db, document)

    log_activity(
        db, admin.id, "document_upload",
        f"Uploaded '{file.filename}' ({chunks_indexed} chunks indexed)",
    )

    return document


@router.get("/", response_model=List[DocumentOut])
def list_documents(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(document.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()
    log_activity(db, admin.id, "document_delete", f"Deleted document id={document_id}")
    return None
