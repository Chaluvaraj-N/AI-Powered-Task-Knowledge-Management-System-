from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.ai.embedding_engine import engine
from app.models.models import User, Document, DocumentChunk, SearchQuery
from app.schemas.schemas import SearchRequest, SearchResponse, SearchResultItem
from app.api.deps import get_current_user
from app.services.activity_service import log_activity

router = APIRouter(prefix="/search", tags=["Semantic Search"])


@router.post("/", response_model=SearchResponse)
def semantic_search(
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    query -> embedding (local TF-IDF + SVD model) -> FAISS nearest-neighbour
    retrieval -> map back to document chunks.
    """
    top_k = payload.top_k or settings.TOP_K_RESULTS
    raw_results = engine.search(payload.query, top_k=top_k)

    results = []
    for vector_row_id, score in raw_results:
        chunk = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.vector_row_id == vector_row_id)
            .first()
        )
        if not chunk:
            continue
        document = db.query(Document).filter(Document.id == chunk.document_id).first()
        if not document:
            continue
        results.append(
            SearchResultItem(
                document_id=document.id,
                document_title=document.title,
                chunk_text=chunk.content,
                score=round(score, 4),
            )
        )

    # Persist the query for analytics ("most searched queries") + activity log
    sq = SearchQuery(
        user_id=current_user.id, query_text=payload.query, result_count=len(results)
    )
    db.add(sq)
    db.commit()

    log_activity(
        db, current_user.id, "search",
        f"Query: '{payload.query}' -> {len(results)} results",
    )

    return SearchResponse(query=payload.query, results=results)
