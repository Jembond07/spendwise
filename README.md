# SpendWise

A personal finance tracker: log expenses, import bank CSVs, auto-categorize
spending with Claude, visualize trends, and set budgets.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system design and
[docs/API.md](docs/API.md) for the API reference.

## Stack

- **Frontend** — React + Vite + Recharts
- **Backend** — Python FastAPI + SQLAlchemy
- **Database** — SQLite
- **AI categorization** — Claude API (falls back to keyword matching if no API key is set)

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optionally add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000` (interactive docs at `/docs`).

Run tests:

```bash
cd backend
source .venv/bin/activate
pytest
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api/*` requests to the
backend at `http://127.0.0.1:8000`.

## Project layout

```
spendwise/
├── frontend/    React app
├── backend/     FastAPI app
└── docs/        Architecture and API docs
```
