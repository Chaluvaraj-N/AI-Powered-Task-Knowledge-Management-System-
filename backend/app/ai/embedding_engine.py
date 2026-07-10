"""
Core AI Semantic Search Engine
===============================
This module implements semantic search WITHOUT calling any external LLM / embedding API.

Pipeline (classic, well-understood NLP technique):
    1. Text is cleaned & tokenized.
    2. A TF-IDF matrix is built/updated over all indexed chunks (custom vocabulary,
       term-frequency & inverse-document-frequency computed locally with scikit-learn's
       mathematical primitives -- no pretrained network, no internet download, no LLM
       embedding API call).
    3. For large corpora, TruncatedSVD ("Latent Semantic Analysis") additionally
       compresses the sparse TF-IDF matrix into a dense fixed-size vector, which
       both speeds up search and captures latent topic similarity beyond exact
       word overlap. For small corpora (below SVD_MIN_CHUNKS) we skip the SVD
       step and use the (L2-normalized) TF-IDF vector itself as the embedding --
       SVD's component count is mathematically capped at
       min(n_samples, n_features) - 1, so on a handful of documents it collapses
       onto 1-2 components and destroys discrimination between results. Using
       raw TF-IDF avoids that degenerate case while still being a legitimate,
       widely-used embedding representation.
    4. Vectors are L2-normalized and stored in a FAISS `IndexFlatIP` (inner product
       on normalized vectors == cosine similarity) for fast nearest-neighbour search.

Because the vocabulary/SVD model must stay consistent between the vectors already
stored in FAISS and any new query, the fitted TfidfVectorizer (+ TruncatedSVD, when
active) are persisted to disk with joblib and re-used / incrementally re-fitted as
new documents are uploaded.
"""
from __future__ import annotations

import re
import threading
from pathlib import Path
from typing import List, Tuple

import joblib
import numpy as np
import faiss
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD

from app.core.config import settings

_LOCK = threading.Lock()

VOCAB_PATH = settings.VECTOR_STORE_DIR / "tfidf_vectorizer.joblib"
SVD_PATH = settings.VECTOR_STORE_DIR / "svd_model.joblib"
FAISS_INDEX_PATH = settings.VECTOR_STORE_DIR / "faiss.index"
CORPUS_PATH = settings.VECTOR_STORE_DIR / "corpus_texts.joblib"  # raw chunk texts, needed to refit


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> List[str]:
    """Split raw document text into overlapping word-based chunks."""
    chunk_size = chunk_size or settings.CHUNK_SIZE_WORDS
    overlap = overlap or settings.CHUNK_OVERLAP_WORDS
    words = text.split()
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(words):
            break
        start = end - overlap
    return chunks


class EmbeddingEngine:
    """
    Wraps a TF-IDF (+ optional TruncatedSVD) custom embedding model and a FAISS index.

    Because the TF-IDF vocabulary (and SVD components, when active) change whenever
    the corpus grows meaningfully, the engine keeps the *raw text* of every indexed
    chunk so it can refit the vectorizer and rebuild the FAISS index whenever new
    documents are added. This keeps the implementation simple & fully local (no
    external API) while remaining correct: all existing vectors are recomputed with
    the updated vocabulary so similarity comparisons stay consistent.

    SVD_MIN_CHUNKS controls the hybrid behaviour described in the module docstring:
    below this many chunks we use raw normalized TF-IDF vectors as embeddings
    (dimension = vocabulary size); at/above it we compress with TruncatedSVD to a
    fixed EMBEDDING_DIM for speed and to surface latent topic similarity.
    """

    SVD_MIN_CHUNKS = 60

    def __init__(self):
        self.dim = settings.EMBEDDING_DIM
        self.vectorizer: TfidfVectorizer | None = None
        self.svd: TruncatedSVD | None = None  # None while corpus is small (raw TF-IDF mode)
        self.index: faiss.Index | None = None
        self.corpus_texts: List[str] = []  # index position == vector_row_id
        self._load()

    # ------------------------------------------------------------------ #
    # Persistence
    # ------------------------------------------------------------------ #
    def _load(self):
        if VOCAB_PATH.exists() and CORPUS_PATH.exists():
            self.vectorizer = joblib.load(VOCAB_PATH)
            self.svd = joblib.load(SVD_PATH) if SVD_PATH.exists() else None
            self.corpus_texts = joblib.load(CORPUS_PATH)
            if FAISS_INDEX_PATH.exists():
                self.index = faiss.read_index(str(FAISS_INDEX_PATH))
            else:
                self._rebuild_index()
        else:
            self.vectorizer = None
            self.svd = None
            self.corpus_texts = []
            self.index = None  # created on first rebuild once we know the dimension

    def _save(self):
        joblib.dump(self.vectorizer, VOCAB_PATH)
        if self.svd is not None:
            joblib.dump(self.svd, SVD_PATH)
        elif SVD_PATH.exists():
            SVD_PATH.unlink()
        joblib.dump(self.corpus_texts, CORPUS_PATH)
        faiss.write_index(self.index, str(FAISS_INDEX_PATH))

    # ------------------------------------------------------------------ #
    # Core embedding logic
    # ------------------------------------------------------------------ #
    def _fit_models(self) -> np.ndarray:
        """(Re)fit TF-IDF vectorizer (+ SVD, once the corpus is large enough) on
        the full corpus of chunk texts. Returns the dense embedding matrix."""
        cleaned = [clean_text(t) for t in self.corpus_texts]
        max_features = 20000

        vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
        )
        tfidf_matrix = vectorizer.fit_transform(cleaned)
        self.vectorizer = vectorizer

        if len(cleaned) >= self.SVD_MIN_CHUNKS:
            # Corpus is large enough for SVD components to be meaningful.
            n_components = min(self.dim, min(tfidf_matrix.shape) - 1)
            svd = TruncatedSVD(n_components=n_components, random_state=42)
            dense = svd.fit_transform(tfidf_matrix).astype(np.float32)
            self.svd = svd
        else:
            # Small corpus: use the raw TF-IDF vector itself as the embedding to
            # avoid SVD's degenerate low-component collapse.
            self.svd = None
            dense = tfidf_matrix.toarray().astype(np.float32)

        return dense

    def _rebuild_index(self):
        """Refit models on the whole stored corpus and rebuild the FAISS index."""
        if not self.corpus_texts:
            self.index = faiss.IndexFlatIP(self.dim)
            return
        vectors = self._fit_models()
        faiss.normalize_L2(vectors)
        self.index = faiss.IndexFlatIP(vectors.shape[1])
        self.index.add(vectors)

    def _embed_new_texts(self, texts: List[str]) -> np.ndarray:
        """Embed texts using the *currently fitted* vectorizer (+ SVD, if active)."""
        cleaned = [clean_text(t) for t in texts]
        tfidf = self.vectorizer.transform(cleaned)
        if self.svd is not None:
            dense = self.svd.transform(tfidf).astype(np.float32)
        else:
            dense = tfidf.toarray().astype(np.float32)
        return dense

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def add_texts(self, texts: List[str]) -> List[int]:
        """
        Add a batch of chunk texts to the vector store.
        Returns the list of vector_row_ids assigned to each text (their position
        in the FAISS index / corpus list).
        """
        with _LOCK:
            start_id = len(self.corpus_texts)
            self.corpus_texts.extend(texts)
            row_ids = list(range(start_id, start_id + len(texts)))

            # Refit whenever the vocabulary doesn't exist yet, or the corpus is
            # still small/near the SVD switch-over point (cheap to refit and keeps
            # vocabulary + component quality up to date). Larger corpora reuse the
            # existing fitted models for speed and only refit periodically.
            need_refit = (
                self.vectorizer is None
                or len(self.corpus_texts) <= self.SVD_MIN_CHUNKS + 40
            )

            if need_refit:
                self._rebuild_index()
            else:
                new_vectors = self._embed_new_texts(texts)
                faiss.normalize_L2(new_vectors)
                self.index.add(new_vectors)

            self._save()
            return row_ids

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, float]]:
        """Return list of (vector_row_id, similarity_score) sorted by score desc."""
        if self.vectorizer is None or self.index is None or self.index.ntotal == 0:
            return []
        query_vec = self._embed_new_texts([query])
        faiss.normalize_L2(query_vec)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(query_vec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((int(idx), float(score)))
        return results


# Singleton engine instance shared across the app
engine = EmbeddingEngine()
