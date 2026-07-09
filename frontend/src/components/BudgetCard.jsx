import CategoryBadge from "./CategoryBadge.jsx";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function BudgetCard({ status, onEdit, onDelete }) {
  const { budget, spent, pct_used, over_alert } = status;
  const pctClamped = Math.min(pct_used, 100);
  const barColor = over_alert ? "var(--danger)" : "var(--primary)";

  return (
    <div className="card">
      <div className="form-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <CategoryBadge category={budget.category} />
        <div className="form-row" style={{ gap: "0.4rem" }}>
          <button className="secondary" onClick={() => onEdit(budget)}>
            Edit
          </button>
          <button className="danger" onClick={() => onDelete(budget.id)}>
            Delete
          </button>
        </div>
      </div>
      <div style={{ margin: "0.75rem 0 0.35rem 0" }} className="text-muted">
        {formatCurrency(spent)} of {formatCurrency(budget.monthly_limit)} spent this month
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pctClamped}%`, background: barColor }} />
      </div>
      {over_alert && (
        <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
          Over your {budget.alert_pct}% alert threshold ({pct_used.toFixed(0)}% used)
        </div>
      )}
    </div>
  );
}
