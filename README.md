# Local AI Chatbot

Local, fast, multi-project AI chatbot with OpenAI / Ollama switching, per-project RAG isolation, streaming chat, and a modern Next.js UI.

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL |
| Vectors | Qdrant |
| AI | OpenAI + Ollama (runtime switchable) |
| Frontend | Next.js 14, TypeScript, Tailwind, Zustand, TanStack Query |
| Infra | Docker Compose |

## Features

- Multiple projects and chats with history
- Streaming responses (SSE)
- Document upload + RAG (PDF, DOCX, TXT, MD, CSV, code)
- Project isolation (documents / embeddings / vector index never cross projects)
- Provider detection (OpenAI / Ollama)
- Settings, logs, statistics
- Dark / light mode, command palette (`⌘K`)
- Bilingual UI: Persian (RTL) + English (LTR), switchable anytime

## Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) (for local models)

Recommended Ollama models:

```bash
ollama pull codellama:7b
ollama pull nomic-embed-text
```

## Quick start

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5433`
- Qdrant on `localhost:6333`

> Port `5433` is used so it does not collide with other local Postgres instances on `5432`.

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs  
Health: http://localhost:8000/api/v1/health

### 3. Frontend

```bash
cd frontend
copy .env.local.example .env.local   # Windows
# cp .env.local.example .env.local   # macOS / Linux

npm install
npm run dev
```

App: http://localhost:3000

## Configuration

Edit `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://chatbot:chatbot@localhost:5433/chatbot
QDRANT_URL=http://localhost:6333
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=
DEFAULT_AI_PROVIDER=ollama
DEFAULT_CHAT_MODEL=codellama:7b
DEFAULT_EMBEDDING_MODEL=nomic-embed-text
```

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Provider / model can be changed from **Settings** without restarting the server. Secrets stay in `.env` and are never exposed to the browser.

## Project layout

```text
chat_bot_local/
├── backend/                 # FastAPI (Clean Architecture)
│   ├── app/
│   │   ├── api/             # HTTP routes
│   │   ├── application/     # Services + schemas
│   │   ├── domain/          # Entities + interfaces
│   │   ├── infrastructure/  # DB, AI providers, RAG, repos
│   │   └── core/            # Config, DI, middleware
│   └── alembic/
├── frontend/                # Next.js App Router UI
├── md/                      # Product / architecture docs
├── docker-compose.yml
└── README.md
```

## Useful API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/providers/detect` | Detect OpenAI / Ollama + models |
| GET/POST | `/api/v1/projects` | List / create projects |
| GET/POST | `/api/v1/projects/{id}/chats` | Project chats |
| POST | `/api/v1/chats/{id}/messages/stream` | Stream chat (SSE) |
| POST | `/api/v1/projects/{id}/documents` | Upload document for RAG |
| GET/PATCH | `/api/v1/settings` | App settings |
| GET | `/api/v1/logs` | Audit / app logs |
| GET | `/api/v1/stats` | Usage statistics |

## Docs

Source-of-truth specifications live in [`md/`](./md):

- `00_project.md` — product overview
- `01_backend.md` — backend architecture
- `02_database.md` — schema rules
- `03_ai_engine.md` — providers
- `04_rag.md` — knowledge base
- `05_frontend.md` — UI stack
- `06_ui_ux.md` / `07_style_guide.md` — design
- `08_security.md` / `09_deployment.md` — security & deploy

## Troubleshooting

**Postgres port already in use**  
Compose maps host `5433 → 5432`. Keep `DATABASE_URL` on port `5433`.

**Ollama not detected**  
Make sure `ollama serve` is running and `OLLAMA_URL=http://localhost:11434`.

**Empty / wrong answers with RAG**  
Upload documents to the active project, wait until status is `ready`, and ensure `nomic-embed-text` (or your embedding model) is pulled.

**Frontend cannot reach API**  
Confirm backend is on `:8000` and `NEXT_PUBLIC_API_URL` matches.

## website post:
- [https://missingdata.ir/2580](https://missingdata.ir/2580)
- [ttps://missingdata.ir/2585](https://missingdata.ir/2585)

## License

See [COPYRIGHT.md](./COPYRIGHT.md).

**درست‌کننده:** سجاد اسماعیلی (Sajad Esmaili)  
www.missingdata.ir | www.sajjadesmaili.ir  

Free to use in your projects. Support: https://sajjadesmaili.ir/support/
