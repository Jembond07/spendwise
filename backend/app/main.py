from contextlib import asynccontextmanager
from datetime import date
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.categorizer import categorize_expense
from app.csv_parser import CsvParseError, parse_csv
from app.database import get_db, init_db
from app.models import (
    Account,
    AccountCreate,
    AccountOut,
    AccountUpdate,
    Budget,
    BudgetCreate,
    BudgetOut,
    BudgetStatus,
    BudgetUpdate,
    Category,
    CategoryCreate,
    CategoryOut,
    CategoryTotal,
    CategorizeRequest,
    CategorizeResponse,
    CategoryUpdate,
    DashboardResponse,
    Expense,
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    ImportResult,
    MonthlyTotal,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = next(get_db())
    try:
        if db.query(Category).count() == 0:
            for cat in DEFAULT_CATEGORIES:
                db.add(Category(**cat))
        if db.query(Account).count() == 0:
            for acct in DEFAULT_ACCOUNTS:
                db.add(Account(**acct))
        db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="SpendWise API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_CATEGORIES = [
    {"name": "Groceries", "color": "#22c55e", "icon": "shopping-cart", "ai_keywords": ["grocery", "supermarket", "whole foods", "trader joe", "safeway", "kroger"]},
    {"name": "Dining", "color": "#f97316", "icon": "utensils", "ai_keywords": ["restaurant", "cafe", "coffee", "starbucks", "doordash", "uber eats", "grubhub"]},
    {"name": "Transportation", "color": "#3b82f6", "icon": "car", "ai_keywords": ["uber", "lyft", "gas", "fuel", "parking", "transit", "metro"]},
    {"name": "Entertainment", "color": "#a855f7", "icon": "film", "ai_keywords": ["netflix", "spotify", "movie", "cinema", "concert", "steam"]},
    {"name": "Utilities", "color": "#eab308", "icon": "bolt", "ai_keywords": ["electric", "water bill", "internet", "phone bill", "gas bill"]},
    {"name": "Rent/Mortgage", "color": "#ef4444", "icon": "home", "ai_keywords": ["rent", "mortgage", "landlord"]},
    {"name": "Shopping", "color": "#ec4899", "icon": "bag", "ai_keywords": ["amazon", "target", "walmart", "mall", "clothing"]},
    {"name": "Health", "color": "#14b8a6", "icon": "heart", "ai_keywords": ["pharmacy", "doctor", "dental", "gym", "cvs", "walgreens"]},
    {"name": "Travel", "color": "#06b6d4", "icon": "plane", "ai_keywords": ["airline", "hotel", "airbnb", "flight"]},
    {"name": "Other", "color": "#6b7280", "icon": "tag", "ai_keywords": []},
]

DEFAULT_ACCOUNTS = [
    {"name": "Checking", "type": "checking", "color": "#0ea5e9"},
    {"name": "Credit Card", "type": "credit", "color": "#f43f5e"},
    {"name": "Savings", "type": "savings", "color": "#10b981"},
    {"name": "Investment", "type": "investment", "color": "#8b5cf6"},
]


@app.get("/")
def health():
    return {"status": "ok", "service": "spendwise-api"}


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


@app.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()


@app.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    db.delete(category)
    db.commit()


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------


@app.get("/accounts", response_model=list[AccountOut])
def list_accounts(db: Session = Depends(get_db)):
    return db.query(Account).order_by(Account.name).all()


@app.post("/accounts", response_model=AccountOut, status_code=201)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    account = Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@app.put("/accounts/{account_id}", response_model=AccountOut)
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(404, "Account not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(404, "Account not found")
    db.delete(account)
    db.commit()


# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------


@app.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Expense)
    if category_id is not None:
        query = query.filter(Expense.category_id == category_id)
    if account_id is not None:
        query = query.filter(Expense.account_id == account_id)
    if start_date is not None:
        query = query.filter(Expense.date >= start_date)
    if end_date is not None:
        query = query.filter(Expense.date <= end_date)
    if search:
        query = query.filter(Expense.description.ilike(f"%{search}%"))
    return (
        query.order_by(Expense.date.desc(), Expense.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@app.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    return expense


@app.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    db.delete(expense)
    db.commit()


# ---------------------------------------------------------------------------
# CSV import
# ---------------------------------------------------------------------------


@app.post("/import/csv", response_model=ImportResult)
async def import_csv(
    file: UploadFile,
    auto_categorize: bool = False,
    account_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if account_id is not None and not db.get(Account, account_id):
        raise HTTPException(404, "Account not found")

    content = await file.read()
    try:
        rows, errors = parse_csv(content)
    except CsvParseError as exc:
        raise HTTPException(400, str(exc))

    categories = db.query(Category).all() if auto_categorize else []

    seen = set()
    if rows:
        existing = db.query(Expense.date, Expense.amount, Expense.description, Expense.account_id).filter(
            Expense.date.in_({row.date for row in rows}),
            Expense.account_id == account_id,
        )
        seen = {(e.date, e.amount, e.description, e.account_id) for e in existing}

    imported = 0
    duplicates = 0
    for row in rows:
        key = (row.date, row.amount, row.description, account_id)
        if key in seen:
            duplicates += 1
            continue
        seen.add(key)

        category_id = None
        if auto_categorize:
            result = categorize_expense(row.description, categories)
            category_id = result.category_id
        db.add(
            Expense(
                amount=row.amount,
                description=row.description,
                date=row.date,
                category_id=category_id,
                account_id=account_id,
                source="csv",
            )
        )
        imported += 1
    db.commit()

    return ImportResult(imported=imported, duplicates=duplicates, skipped=len(errors), errors=errors)


# ---------------------------------------------------------------------------
# Categorize
# ---------------------------------------------------------------------------


@app.post("/categorize", response_model=CategorizeResponse)
def categorize(payload: CategorizeRequest, db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categorize_expense(payload.description, categories)


# ---------------------------------------------------------------------------
# Budgets
# ---------------------------------------------------------------------------


@app.get("/budgets", response_model=list[BudgetOut])
def list_budgets(db: Session = Depends(get_db)):
    return db.query(Budget).all()


@app.post("/budgets", response_model=BudgetOut, status_code=201)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)):
    if not db.get(Category, payload.category_id):
        raise HTTPException(404, "Category not found")
    if db.query(Budget).filter(Budget.category_id == payload.category_id).first():
        raise HTTPException(400, "Budget already exists for this category")
    budget = Budget(**payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@app.put("/budgets/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)):
    budget = db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(404, "Budget not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@app.delete("/budgets/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(404, "Budget not found")
    db.delete(budget)
    db.commit()


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)
    return start, end


def _sum_amount(db: Session, start: date, end: Optional[date] = None, category_id: Optional[int] = None) -> float:
    query = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(Expense.date >= start)
    if end is not None:
        query = query.filter(Expense.date < end)
    if category_id is not None:
        query = query.filter(Expense.category_id == category_id)
    return float(query.scalar() or 0.0)


@app.get("/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    this_month_start, next_month_start = _month_bounds(today.year, today.month)
    last_month = today.month - 1 or 12
    last_month_year = today.year if today.month > 1 else today.year - 1
    last_month_start, _ = _month_bounds(last_month_year, last_month)

    total_this_month = _sum_amount(db, this_month_start, next_month_start)
    total_last_month = _sum_amount(db, last_month_start, this_month_start)
    total_all_time = float(
        db.query(func.coalesce(func.sum(Expense.amount), 0.0)).scalar() or 0.0
    )

    by_category_rows = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            func.coalesce(func.sum(Expense.amount), 0.0).label("total"),
        )
        .join(Expense, Expense.category_id == Category.id)
        .filter(Expense.date >= this_month_start, Expense.date < next_month_start)
        .group_by(Category.id)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    by_category = [
        CategoryTotal(category_id=r.id, category_name=r.name, color=r.color, total=float(r.total))
        for r in by_category_rows
    ]

    monthly_trend: list[MonthlyTotal] = []
    year, month = today.year, today.month
    for _ in range(6):
        start, end = _month_bounds(year, month)
        total = _sum_amount(db, start, end)
        monthly_trend.append(MonthlyTotal(month=f"{year:04d}-{month:02d}", total=total))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    monthly_trend.reverse()

    budgets = db.query(Budget).all()
    budget_status = []
    for budget in budgets:
        spent = _sum_amount(db, this_month_start, next_month_start, category_id=budget.category_id)
        pct_used = (spent / budget.monthly_limit * 100) if budget.monthly_limit else 0.0
        budget_status.append(
            BudgetStatus(
                budget=BudgetOut.model_validate(budget),
                spent=spent,
                pct_used=pct_used,
                over_alert=pct_used >= budget.alert_pct,
            )
        )

    return DashboardResponse(
        total_this_month=total_this_month,
        total_last_month=total_last_month,
        total_all_time=total_all_time,
        by_category=by_category,
        monthly_trend=monthly_trend,
        budget_status=budget_status,
    )
