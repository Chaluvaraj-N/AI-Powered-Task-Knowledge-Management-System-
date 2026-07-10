from pathlib import Path

from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.ai.embedding_engine import engine, chunk_text
from app.models.models import Document, DocumentChunk


def extract_text(file_path: Path, file_type: str) -> str:
    if file_type == "txt":
        return file_path.read_text(errors="ignore")
    if file_type == "pdf":
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    raise ValueError(f"Unsupported file type: {file_type}")


def index_document(db: Session, document: Document) -> int:
    """
    Extracts text from the stored file, splits it into chunks, embeds every
    chunk (custom TF-IDF + SVD pipeline) and stores the vectors in FAISS.
    Returns the number of chunks indexed.
    """
    text = extract_text(Path(document.file_path), document.file_type)
    chunks = chunk_text(text)

    if not chunks:
        document.indexed = True
        db.commit()
        return 0

    row_ids = engine.add_texts(chunks)

    for idx, (content, row_id) in enumerate(zip(chunks, row_ids)):
        db_chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=idx,
            content=content,
            vector_row_id=row_id,
        )
        db.add(db_chunk)

    document.indexed = True
    db.commit()
    return len(chunks)
