import { useEffect, useState } from "react";

import CategoryChart from "../components/CategoryChart.jsx";
import SpendingChart from "../components/SpendingChart.jsx";
import { getDashboard } from "../utils/api.js";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const monthOverMonth = data.total_last_month
    ? ((data.total_this_month - data.total_last_month) / data.total_last_month) * 100
    : null;

  const alerts = data.budget_status.filter((s) => s.over_alert);

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="grid grid-3">
        <div className="card stat">
          <span className="label">This month</span>
          <span className="value">{formatCurrency(data.total_this_month)}</span>
          {monthOverMonth !== null && (
            <span className="text-muted">
              {monthOverMonth >= 0 ? "+" : ""}
              {monthOverMonth.toFixed(1)}% vs last month
            </span>
          )}
        </div>
        <div className="card stat">
          <span className="label">Last month</span>
          <span className="value">{formatCurrency(data.total_last_month)}</span>
        </div>
        <div className="card stat">
          <span className="label">All time</span>
          <span className="value">{formatCurrency(data.total_all_time)}</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <h3 style={{ color: "var(--danger)" }}>Budget alerts</h3>
          {alerts.map((s) => (
            <p key={s.budget.id}>
              <strong>{s.budget.category?.name}</strong> is at {s.pct_used.toFixed(0)}% of its{" "}
              {formatCurrency(s.budget.monthly_limit)} budget.
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3>Spending by category (this month)</h3>
          <CategoryChart data={data.by_category} />
        </div>
        <div className="card">
          <h3>Monthly trend</h3>
          <SpendingChart data={data.monthly_trend} />
        </div>
      </div>
    </div>
  );
}
