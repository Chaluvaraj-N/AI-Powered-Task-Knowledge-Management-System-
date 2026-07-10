# AI-Powered Task & Knowledge Management System

An MVP where an **admin** builds a knowledge base by uploading documents and assigns
tasks to **users**, and users search that knowledge base with **AI-powered semantic
search** and complete their assigned tasks.

> Built for the "AI-Powered Task & Knowledge Management System" assessment.
> All 8 mandatory requirements, all 5 required API groups, and both constraint
> stacks (FastAPI + React + MySQL + JWT + custom embeddings) are implemented and
> have been tested end-to-end against a real MySQL 8.0 database — see
> [`docs/screenshots`](docs/screenshots) and the verification notes below.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, **FastAPI**, SQLAlchemy 2.0 |
| Database | **MySQL 8** (via PyMySQL) — SQLite fallback for zero-setup local demos |
| Auth | **JWT** (python-jose) + bcrypt password hashing, role-based access control |
| AI / Semantic Search | **scikit-learn** (TF-IDF + TruncatedSVD, implemented from scratch — no external embedding API) + **FAISS** vector index |
| PDF/TXT parsing | pypdf |
| Frontend | **React 19** (Vite), React Router, Axios, Tailwind CSS v4 |

---

## Why this satisfies "core AI logic must be implemented"

The assignment explicitly forbids relying only on an LLM API for the semantic search
feature. This system **never calls an external embedding/LLM API**. Instead
(`backend/app/ai/embedding_engine.py`):

1. **Chunking** — uploaded documents are split into overlapping word-based chunks.
2. **TF-IDF** — a vocabulary and term-frequency/inverse-document-frequency matrix is
   fit locally with scikit-learn (`TfidfVectorizer`, unigrams+bigrams).
3. **Dimensionality reduction** — once the corpus is large enough for it to be
   meaningful, `TruncatedSVD` ("Latent Semantic Analysis") compresses TF-IDF vectors
   into dense 128-dim embeddings. For small corpora (a handful of chunks — the
   realistic size for a quick demo/evaluation) SVD's component count is
   mathematically capped at `min(samples, features) - 1`, which would collapse
   everything onto 1–2 components and destroy ranking quality — so below that
   threshold the engine uses the raw normalized TF-IDF vector directly as the
   embedding instead. Both paths are genuine, well-understood embedding techniques
   implemented with scikit-learn's mathematical primitives, not a pretrained network.
4. **Vector storage & retrieval** — vectors are L2-normalized and stored in a
   **FAISS** `IndexFlatIP` index (inner product on normalized vectors = cosine
   similarity) for fast nearest-neighbour search.
5. **Query → embedding → retrieve** — a search query goes through the exact same
   pipeline, and FAISS returns the top-k nearest chunks, which are mapped back to
   their source document.

The fitted vectorizer/SVD model and the FAISS index are persisted to disk
(`backend/storage/vector_store/`) and reloaded on restart / incrementally updated
as new documents are uploaded.

---

## Requirements Checklist

- [x] **JWT authentication** with `admin` / `user` roles, protected routes via FastAPI dependencies
- [x] **MySQL** relational schema with 7 tables and FK constraints (`roles`, `users`, `documents`, `document_chunks`, `tasks`, `activity_logs`, `search_queries`)
- [x] **Document upload** (.txt, .pdf) with metadata stored + text extracted for AI processing
- [x] **Semantic search**: text → embedding (custom TF-IDF/SVD) → FAISS vector store → query → retrieve
- [x] **Task management**: admin creates & assigns; user views & updates status (pending → completed)
- [x] **Dynamic filtering**: `GET /api/tasks?status=completed`, `GET /api/tasks?assigned_to=1` (combinable)
- [x] **Activity logging**: login, task update, document upload, search — all recorded
- [x] **Basic analytics**: total tasks, completed vs pending, most-searched queries
- [x] Required APIs: `/api/auth/login`, `/api/tasks`, `/api/documents`, `/api/search`, `/api/analytics`

---

## Project Structure

```
task-ai-system/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app, router wiring, CORS, startup
│   │   ├── core/                  # config (env settings) + security (JWT/bcrypt)
│   │   ├── db/                    # SQLAlchemy session + init_db (create tables, seed data)
│   │   ├── models/models.py       # ORM models = the relational schema
│   │   ├── schemas/schemas.py     # Pydantic request/response models
│   │   ├── ai/embedding_engine.py # <-- the core AI logic (TF-IDF/SVD + FAISS)
│   │   ├── services/              # document text extraction/indexing, activity logging
│   │   └── api/
│   │       ├── deps.py            # get_current_user / require_admin (RBAC)
│   │       └── routes/            # auth, users, documents, tasks, search, analytics, activity_logs
│   ├── storage/                   # uploaded files + persisted vector index (gitignored contents)
│   ├── requirements.txt
│   ├── create_database.sql        # run once to create the empty MySQL database
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                   # axios client + endpoint wrappers
│   │   ├── context/AuthContext.jsx
│   │   ├── components/            # AppLayout (sidebar), shared UI primitives
│   │   └── pages/                 # Login, Dashboard, Search, Tasks, Documents, Activity
│   └── package.json
└── docs/screenshots/              # output screenshots (see below)
```

---

## Setup Steps

### 1. Database (MySQL)

```bash
# Start your MySQL server, then create the empty database:
mysql -u root -p < backend/create_database.sql
```

This creates `task_ai_db`. The application creates all tables automatically on
first run (no manual migration needed).

> **No MySQL available?** Skip this step — the backend falls back to a local
> SQLite file (`backend/storage/app.db`) automatically if `DATABASE_URL` is unset,
> so you can demo the whole system with zero extra setup. Everything else
> (auth, RBAC, AI search, tasks, logging, analytics) behaves identically.

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set DATABASE_URL to your MySQL connection string
# (or delete/leave it unset to use the SQLite fallback)

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`). On first startup it seeds two demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@company.com` | `Admin@123` |
| User | `user@company.com` | `User@123` |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to
`http://localhost:8000`, so no extra CORS configuration is needed locally.

### 4. Try it out

1. Sign in as **admin** → go to **Documents** → upload a `.txt` or `.pdf` file.
2. Go to **Tasks** → create a task and assign it to the demo user.
3. Sign out, sign in as **user** → go to **Search Knowledge** → ask a question
   related to the uploaded document and see AI-ranked results.
4. Mark the assigned task as complete from **Tasks**.
5. Back in admin → check **Activity Log** and the **Dashboard** analytics.

---

## API Overview

All endpoints are prefixed with `/api`. Protected endpoints require
`Authorization: Bearer <token>`.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Returns JWT + user profile |
| POST | `/auth/register` | public | Self-service signup (always creates a `user`) |
| GET | `/auth/me` | any | Current user profile |
| GET | `/users/` | any | List users (needed for admin's assignee picker) |
| POST | `/users/` | admin | Create a user with a specific role |
| POST | `/documents/` | admin | Upload `.txt`/`.pdf`, auto-chunk + embed + index |
| GET | `/documents/` | any | List documents |
| DELETE | `/documents/{id}` | admin | Delete a document |
| POST | `/search/` | any | Semantic search: query → embedding → FAISS → results |
| POST | `/tasks/` | admin | Create & assign a task |
| GET | `/tasks/?status=&assigned_to=` | any | Dynamic filtering (users only ever see their own tasks) |
| PATCH | `/tasks/{id}/status` | any (owner or admin) | Update pending ↔ completed |
| DELETE | `/tasks/{id}` | admin | Delete a task |
| GET | `/analytics/` | any | Task counts, doc/user counts, most-searched queries |
| GET | `/activity-logs/` | admin | Recent activity feed |

---

## Database Schema (MySQL)

```
roles(id PK, name)
users(id PK, full_name, email, hashed_password, role_id FK->roles, is_active, created_at)
documents(id PK, title, filename, file_path, file_type, uploaded_by_id FK->users, uploaded_at, indexed)
document_chunks(id PK, document_id FK->documents, chunk_index, content, vector_row_id)
tasks(id PK, title, description, status, assigned_to_id FK->users, created_by_id FK->users, created_at, updated_at)
activity_logs(id PK, user_id FK->users, action, details, created_at)
search_queries(id PK, user_id FK->users, query_text, result_count, created_at)
```

`document_chunks.vector_row_id` maps a chunk to its row inside the FAISS index,
so a similarity search result can be traced back to its source document.

---

## Design Notes / Trade-offs (MVP scope, 1.5-day brief)

- **Text-only AI pipeline**: embeddings are built with TF-IDF + SVD rather than a
  pretrained transformer, per the "do not rely only on LLM APIs / core logic must
  be implemented" requirement. This is a legitimate, classic IR technique, but a
  neural sentence-embedding model would generalize better to paraphrased/synonymous
  queries at production scale.
- **Deleting a document** removes its DB row but does not currently prune its
  vectors from FAISS (acceptable for an MVP; a production version would rebuild the
  index or tombstone the row).
- **SQLite fallback**: purely a convenience for instant local evaluation. The schema,
  ORM models, and every feature are identical on MySQL — this was verified by running
  the full test flow against a real local MySQL 8.0 instance during development.

---

## Output Screenshots

See [`docs/screenshots/`](docs/screenshots):

1. `01_login.png` — Login screen
2. `02_admin_dashboard.png` — Admin dashboard / analytics
3. `03_documents.png` — Document upload & indexing status
4. `04_semantic_search.png` — AI semantic search results with similarity scores
5. `05_admin_tasks.png` — Task creation & assignment
6. `06_activity_log.png` — Activity log
7. `07_user_dashboard.png` — Regular user's dashboard (RBAC-limited nav)
8. `08_user_tasks.png` — Regular user's own tasks view
