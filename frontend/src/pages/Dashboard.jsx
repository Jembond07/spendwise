import { useEffect, useState } from "react";

import CategoryChart from "../components/CategoryChart.jsx";
import SpendingChart from "../components/SpendingChart.jsx";
import { getDashboard, getExpenses } from "../utils/api.js";
import { getCategoryIcon } from "../utils/icons.js";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message));
    getExpenses({ limit: 5 })
      .then(setRecent)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const monthOverMonth = data.total_last_month
    ? ((data.total_this_month - data.total_last_month) / data.total_last_month) * 100
    : null;

  const categoryTotal = data.by_category.reduce((sum, c) => sum + Math.abs(c.total), 0);

  return (
    <div>
      <h1 className="greeting">
        {greeting()}
        {"! "}
        <span className="text-muted" style={{ fontWeight: 500 }}>
          Here's where things stand.
        </span>
      </h1>

      <div className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <div>
          <div className="card">
            <span className="label text-muted">Spending this month</span>
            <div className="hero-value">{formatCurrency(data.total_this_month)}</div>
            {monthOverMonth !== null && (
              <span className={monthOverMonth <= 0 ? "amount-positive" : "text-muted"}>
                {monthOverMonth >= 0 ? "+" : ""}
                {monthOverMonth.toFixed(1)}% vs last month ({formatCurrency(data.total_last_month)})
              </span>
            )}
            <SpendingChart data={data.monthly_trend} />
          </div>

          <div className="card">
            <h3>Spending by category</h3>
            {data.by_category.length === 0 ? (
              <p className="empty-state">No spending this month yet.</p>
            ) : (
              <div className="form-row" style={{ alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                  <CategoryChart data={data.by_category} />
                </div>
                <div className="row-list" style={{ flex: "1 1 220px", gap: "0.6rem" }}>
                  {data.by_category.map((c) => (
                    <div key={c.category_id ?? c.category_name} className="form-row" style={{ justifyContent: "space-between", gap: "0.5rem" }}>
                      <span>
                        <span aria-hidden="true">{getCategoryIcon(c.icon)}</span> {c.category_name}
                      </span>
                      <span className="text-muted">
                        {formatCurrency(c.total)} · {((Math.abs(c.total) / categoryTotal) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Budgets</h3>
            {data.budget_status.length === 0 ? (
              <p className="empty-state">No budgets set yet.</p>
            ) : (
              <div className="row-list">
                {data.budget_status.map((s) => {
                  const pct = Math.min(s.pct_used, 100);
                  return (
                    <div key={s.budget.id} className="budget-row">
                      <div className="budget-row-top">
                        <span className="budget-row-name">
                          <span aria-hidden="true">{getCategoryIcon(s.budget.category?.icon)}</span>
                          {s.budget.category?.name}
                        </span>
                        <span className={s.over_alert ? "" : "text-muted"} style={s.over_alert ? { color: "var(--danger)" } : undefined}>
                          {formatCurrency(s.spent)} of {formatCurrency(s.budget.monthly_limit)}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(pct, 0)}%`,
                            background: s.over_alert ? "var(--danger)" : "var(--primary)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Recent transactions</h3>
            {!recent ? (
              <p className="text-muted">Loading…</p>
            ) : recent.length === 0 ? (
              <p className="empty-state">No expenses yet.</p>
            ) : (
              <div className="row-list">
                {recent.map((expense) => (
                  <div key={expense.id} className="tx-row">
                    <span
                      className="icon-circle"
                      style={{
                        background: expense.category ? `${expense.category.color}22` : "var(--bg)",
                      }}
                      aria-hidden="true"
                    >
                      {getCategoryIcon(expense.category?.icon)}
                    </span>
                    <div className="tx-main">
                      <div className="tx-desc">{expense.description}</div>
                      <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                        {expense.date}
                      </div>
                    </div>
                    <span className={`tx-amount ${expense.amount > 0 ? "amount-positive" : ""}`}>
                      {expense.amount > 0 ? "+" : ""}
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
