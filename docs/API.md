# SpendWise API

Base URL (dev): `http://127.0.0.1:8000`

All request/response bodies are JSON unless noted otherwise. Interactive docs
are also available at `/docs` (Swagger UI) once the server is running.

## Categories

| Method | Path                | Description          |
|--------|---------------------|-----------------------|
| GET    | `/categories`        | List all categories   |
| POST   | `/categories`        | Create a category     |
| PUT    | `/categories/{id}`   | Update a category     |
| DELETE | `/categories/{id}`   | Delete a category     |

`Category`: `{ id, name, color, icon, ai_keywords: string[] }`

## Expenses

| Method | Path              | Description                                                             |
|--------|-------------------|---------------------------------------------------------------------------|
| GET    | `/expenses`        | List expenses. Query params: `category_id`, `start_date`, `end_date`, `search`, `limit`, `offset` |
| POST   | `/expenses`         | Create an expense                                                        |
| GET    | `/expenses/{id}`    | Get one expense                                                          |
| PUT    | `/expenses/{id}`    | Update an expense                                                        |
| DELETE | `/expenses/{id}`    | Delete an expense                                                        |

`Expense`: `{ id, amount, description, date, category_id, category, source }`
`source` is `"manual"` or `"csv"`.

## Import

| Method | Path          | Description                                     |
|--------|---------------|--------------------------------------------------|
| POST   | `/import/csv` | Upload a bank statement CSV (`multipart/form-data`, field `file`). Query param `auto_categorize` (bool, default `false`) runs each row through `/categorize`. |

Response: `{ imported: number, skipped: number, errors: string[] }`

CSV columns are matched case-insensitively against common bank export
headers (`date`, `description`/`memo`/`payee`, `amount`, or separate
`debit`/`credit` columns).

## Categorize

| Method | Path          | Description                                  |
|--------|---------------|-----------------------------------------------|
| POST   | `/categorize` | Suggest a category for a description         |

Request: `{ description: string }`
Response: `{ category_id, category_name, confidence, method }`
`method` is `"claude"` (used the Claude API), `"keyword"` (fallback keyword
match), or `"none"`.

## Budgets

| Method | Path            | Description                    |
|--------|-----------------|----------------------------------|
| GET    | `/budgets`       | List budgets                    |
| POST   | `/budgets`       | Create a budget (one per category) |
| PUT    | `/budgets/{id}`  | Update a budget                 |
| DELETE | `/budgets/{id}`  | Delete a budget                 |

`Budget`: `{ id, category_id, monthly_limit, alert_pct, category }`

## Dashboard

| Method | Path         | Description        |
|--------|--------------|----------------------|
| GET    | `/dashboard`  | Aggregate stats     |

Response:
```json
{
  "total_this_month": 0,
  "total_last_month": 0,
  "total_all_time": 0,
  "by_category": [{ "category_id": 1, "category_name": "Groceries", "color": "#22c55e", "total": 0 }],
  "monthly_trend": [{ "month": "2026-02", "total": 0 }],
  "budget_status": [{ "budget": { }, "spent": 0, "pct_used": 0, "over_alert": false }]
}
```
