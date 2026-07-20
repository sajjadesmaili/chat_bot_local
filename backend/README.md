# Local AI Chatbot — Backend

FastAPI backend for a local, project-scoped RAG chatbot. Clean Architecture
(`api` → `application` → `domain` ← `infrastructure`), Repository Pattern +
Dependency Injection, SQLAlchemy 2.0 async + PostgreSQL, Qdrant for vectors,
and pluggable AI providers (OpenAI / Ollama) switchable at runtime.

## Stack

- **API**: FastAPI (async), SSE streaming
- **DB**: PostgreSQL via SQLAlchemy 2.0 async + asyncpg, Alembic migrations
- **Vectors**: Qdrant (one collection per project — strict isolation)
- **AI providers**: OpenAI, Ollama (common `AIProvider` interface)

## Project layout

```
backend/
  app/
    main.py                     FastAPI app, lifespan, middleware, router mount
    core/                        config, DI wiring, security, logging, rate limiting
    api/v1/                      route modules + aggregating router
    domain/entities/models.py    SQLAlchemy models (Users, Projects, Chats, ...)
    domain/interfaces/           AIProvider + repository contracts
    application/services/        business logic (RAG, chat, documents, ...)
    application/schemas/         Pydantic request/response DTOs
    infrastructure/database/     async engine/session
    infrastructure/repositories/ concrete repositories (CRUD + soft delete)
    infrastructure/ai/           OpenAIProvider, OllamaProvider, factory
    infrastructure/rag/          chunker, parser, embeddings, qdrant, retriever
  alembic/                       migrations
  requirements.txt
  Dockerfile
  .env.example
```

## Setup

1. **Prerequisites**: Python 3.11+, PostgreSQL 14+, Qdrant, and optionally
   Ollama (for local models) and/or an OpenAI API key.

2. **Install dependencies**

   ```bash
   python -m venv .venv
   .venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   ```

3. **Configure environment**

   ```bash
   copy .env.example .env
   ```

   Edit `.env` as needed (defaults work with a local Postgres, local Qdrant,
   and local Ollama).

4. **Create the database** (Postgres):

   ```sql
   CREATE USER chatbot WITH PASSWORD 'chatbot';
   CREATE DATABASE chatbot OWNER chatbot;
   ```

5. **Run migrations** (optional — the app also auto-creates tables on
   startup for convenience, but Alembic is the source of truth for schema
   changes going forward):

   ```bash
   alembic upgrade head
   ```

6. **Start Qdrant** (Docker example):

   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

7. **Start the API**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   On first startup the app creates all tables (if not already migrated),
   seeds the default local user (`id=1`), default settings, and the provider
   catalog (OpenAI/Ollama).

8. Open the interactive docs at `http://localhost:8000/docs`.

## Running with Docker

```bash
docker build -t local-ai-chatbot-backend .
docker run -p 8000:8000 --env-file .env local-ai-chatbot-backend
```

(Point `DATABASE_URL`/`QDRANT_URL`/`OLLAMA_URL` at reachable hosts, e.g. via
`--network` or a docker-compose file with Postgres/Qdrant services.)

## Key behaviors

- **Auth**: optional. If `API_KEY_ENABLED=false` (default), every request is
  attributed to a single local user (`id=1`). Set `API_KEY_ENABLED=true` and
  `API_KEY=...` to require an `X-API-Key` header.
- **Providers**: switch the active provider/model at runtime via
  `PATCH /api/v1/settings` (global) or per-project fields on
  `PATCH /api/v1/projects/{id}` — no restart required.
- **RAG**: per-project Qdrant collections (`project_<id>`) guarantee
  documents/embeddings never leak across projects. Retrieval is hybrid
  (semantic + keyword); if confidence is below
  `RAG_CONFIDENCE_THRESHOLD`, the chat responds with
  *"I couldn't find this information in the project."* instead of guessing.
- **Streaming**: `POST /api/v1/chats/{id}/messages/stream` returns
  `text/event-stream` SSE chunks (`{"type": "chunk", "content": "..."}`)
  ending with `{"type": "done", "message_id": ...}`.
- **Soft delete**: every table has `deleted_at`; all reads filter it out.
- **Logs**: every chat prompt/response, model usage, and error is recorded
  in the `logs` table (`GET /api/v1/logs`).
- **Rate limiting**: simple in-memory sliding window per client IP
  (`RATE_LIMIT_PER_MINUTE`, default 120/min).

## API overview

All routes are prefixed with `/api/v1`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET/POST | `/projects` | List / create projects |
| GET/PATCH/DELETE | `/projects/{id}` | Get / update / soft-delete a project |
| GET/POST | `/projects/{id}/chats` | List / create chats in a project |
| GET/PATCH/DELETE | `/chats/{id}` | Get / update / soft-delete a chat |
| GET/POST | `/chats/{id}/messages` | List / send messages |
| POST | `/chats/{id}/messages/stream` | Streaming chat (SSE) |
| GET/POST | `/projects/{id}/documents` | List / upload documents |
| DELETE | `/documents/{id}?project_id=` | Delete a document |
| GET/PATCH | `/settings` | Get / update global settings |
| GET | `/providers` | List known providers |
| GET | `/providers/detect` | Ping providers for availability + models |
| GET | `/logs` | List logs |
| GET | `/stats` | Aggregate statistics |
