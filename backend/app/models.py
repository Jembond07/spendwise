from datetime import date as date_
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import JSON

from app.database import Base

# ---------------------------------------------------------------------------
# SQLAlchemy ORM models (the tables)
# ---------------------------------------------------------------------------


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String, default="#6366f1")
    icon: Mapped[str] = mapped_column(String, default="tag")
    ai_keywords: Mapped[list] = mapped_column(JSON, default=list)

    expenses: Mapped[list["Expense"]] = relationship(back_populates="category")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="category")


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String, default="checking")  # checking | savings | credit | investment | other
    color: Mapped[str] = mapped_column(String, default="#0ea5e9")

    expenses: Mapped[list["Expense"]] = relationship(back_populates="account")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    account_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )
    date: Mapped[date_] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String, default="manual")  # manual | csv
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    category: Mapped[Optional["Category"]] = relationship(back_populates="expenses")
    account: Mapped[Optional["Account"]] = relationship(back_populates="expenses")


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), unique=True, nullable=False
    )
    monthly_limit: Mapped[float] = mapped_column(Float, nullable=False)
    alert_pct: Mapped[int] = mapped_column(Integer, default=80)

    category: Mapped["Category"] = relationship(back_populates="budgets")


# ---------------------------------------------------------------------------
# Pydantic schemas (request/response shapes)
# ---------------------------------------------------------------------------


class CategoryBase(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: str = "tag"
    ai_keywords: list[str] = []


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    ai_keywords: Optional[list[str]] = None


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class AccountBase(BaseModel):
    name: str
    type: str = "checking"
    color: str = "#0ea5e9"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None


class AccountOut(AccountBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ExpenseBase(BaseModel):
    amount: float
    description: str
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    date: date_
    source: str = "manual"


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    date: Optional[date_] = None


class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: Optional[CategoryOut] = None
    account: Optional[AccountOut] = None


class BudgetBase(BaseModel):
    category_id: int
    monthly_limit: float
    alert_pct: int = 80


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    alert_pct: Optional[int] = None


class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: Optional[CategoryOut] = None


class BudgetStatus(BaseModel):
    budget: BudgetOut
    spent: float
    pct_used: float
    over_alert: bool


class CategorizeRequest(BaseModel):
    description: str


class CategorizeResponse(BaseModel):
    category_id: Optional[int]
    category_name: Optional[str]
    confidence: float
    method: str  # "claude" | "keyword" | "none"


class CategoryTotal(BaseModel):
    category_id: Optional[int]
    category_name: str
    color: str
    icon: str = "tag"
    total: float


class MonthlyTotal(BaseModel):
    month: str  # YYYY-MM
    total: float


class DashboardResponse(BaseModel):
    total_this_month: float
    total_last_month: float
    total_all_time: float
    by_category: list[CategoryTotal]
    monthly_trend: list[MonthlyTotal]
    budget_status: list[BudgetStatus]


class ImportResult(BaseModel):
    imported: int
    duplicates: int
    skipped: int
    errors: list[str]
