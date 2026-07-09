# SpendWise — Architecture Overview

## What This App Does
A personal finance tracker where you log expenses, import bank CSVs,
auto-categorize spending with AI, visualize trends, and set budgets.

## How It's Built (The Big Picture)

```
┌─────────────────────────────────────┐
│           FRONTEND (React)          │
│  What the user sees and clicks      │
│                                     │
│  Pages:                             │
│   • Dashboard  — charts & summary  │
│   • Expenses   — add/list/edit     │
│   • Import     — upload CSV        │
│   • Budgets    — set limits        │
├─────────────────────────────────────┤
│              ↕ HTTP API calls       │
├─────────────────────────────────────┤
│         BACKEND (Python FastAPI)    │
│  The brains — processes requests    │
│                                     │
│  Endpoints:                         │
│   POST /expenses      — add one    │
│   GET  /expenses      — list all   │
│   POST /import/csv    — parse CSV  │
│   GET  /dashboard     — stats      │
│   POST /categorize    — AI magic   │
│   CRUD /budgets       — limits     │
├─────────────────────────────────────┤
│              ↕ SQL queries          │
├─────────────────────────────────────┤
│        DATABASE (SQLite)            │
│  Stores everything in one file     │
│                                     │
│  Tables:                            │
│   • expenses (id, amount, desc,    │
│     category, date, source)        │
│   • categories (id, name, color,   │
│     icon, ai_keywords)             │
│   • budgets (id, category_id,      │
│     monthly_limit, alert_pct)      │
└─────────────────────────────────────┘

         ↕ API call (from backend)

┌─────────────────────────────────────┐
│        CLAUDE API (External)        │
│  Reads expense description →       │
│  Returns best category match       │
└─────────────────────────────────────┘
```

## Tech Stack Choices (and WHY)

| Choice         | Why                                                    |
|----------------|--------------------------------------------------------|
| React + Vite   | Fast dev server, industry standard, component thinking |
| Python FastAPI | Reads like English, best for AI/ML long-term           |
| SQLite         | Zero setup — it's literally just a file                |
| Claude API     | Smart categorization that learns your patterns         |
| Recharts       | Simple React charting, great docs                      |

## Build Order (Feature Roadmap)

### Phase 1 — Foundation (Week 1-2)
- [ ] Backend: FastAPI project with SQLite database
- [ ] Backend: CRUD endpoints for expenses
- [ ] Frontend: React app with Vite
- [ ] Frontend: Add Expense form
- [ ] Frontend: Expense list view

### Phase 2 — Intelligence (Week 3)
- [ ] Backend: Claude API integration for categorization
- [ ] Backend: CSV import endpoint with parsing
- [ ] Frontend: CSV upload UI
- [ ] Frontend: Category management

### Phase 3 — Insights (Week 4)
- [ ] Backend: Dashboard stats endpoint (totals, averages, trends)
- [ ] Frontend: Dashboard with charts (spending by category, monthly trend)
- [ ] Frontend: Budget setting and alerts

### Phase 4 — Polish (Week 5+)
- [ ] Search and filter expenses
- [ ] Date range picker
- [ ] Export data
- [ ] Dark mode
- [ ] Mobile responsive

## Folder Structure
```
spendwise/
├── frontend/               ← React app (what users see)
│   ├── src/
│   │   ├── components/     ← Reusable UI pieces
│   │   ├── pages/          ← Full screens
│   │   ├── utils/          ← Helper functions (API calls)
│   │   └── App.jsx         ← Main app shell
│   ├── package.json
│   └── vite.config.js
│
├── backend/                ← Python API (the brains)
│   ├── app/
│   │   ├── main.py         ← FastAPI app + routes
│   │   ├── database.py     ← SQLite setup
│   │   ├── models.py       ← Data shapes (schemas)
│   │   ├── categorizer.py  ← Claude AI integration
│   │   └── csv_parser.py   ← Bank CSV import logic
│   ├── requirements.txt
│   └── tests/
│
├── docs/
│   ├── ARCHITECTURE.md     ← You are here
│   └── API.md              ← Endpoint documentation
│
├── .gitignore
└── README.md
```

## Key Concepts You'll Learn

1. **API Design** — How frontend talks to backend via HTTP
2. **Database Modeling** — How to structure data in tables
3. **Component Architecture** — Breaking UI into reusable pieces
4. **State Management** — How React tracks what's on screen
5. **AI Integration** — Calling Claude API with structured prompts
6. **File Parsing** — Reading and processing CSV files
7. **Data Visualization** — Turning numbers into charts
