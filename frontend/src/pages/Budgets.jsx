import { useEffect, useState } from "react";

import BudgetCard from "../components/BudgetCard.jsx";
import { createBudget, deleteBudget, getCategories, getDashboard, updateBudget } from "../utils/api.js";

const emptyForm = { category_id: "", monthly_limit: "", alert_pct: 80 };

export default function Budgets() {
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [dashboard, categoryData] = await Promise.all([getDashboard(), getCategories()]);
      setBudgetStatus(dashboard.budget_status);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const budgetedCategoryIds = new Set(budgetStatus.map((s) => s.budget.category_id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id || !form.monthly_limit) return;
    try {
      const payload = {
        category_id: parseInt(form.category_id, 10),
        monthly_limit: parseFloat(form.monthly_limit),
        alert_pct: parseInt(form.alert_pct, 10),
      };
      if (editingId) {
        await updateBudget(editingId, { monthly_limit: payload.monthly_limit, alert_pct: payload.alert_pct });
      } else {
        await createBudget(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (budget) => {
    setEditingId(budget.id);
    setForm({
      category_id: budget.category_id,
      monthly_limit: budget.monthly_limit,
      alert_pct: budget.alert_pct,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Budgets</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>{editingId ? "Edit budget" : "Set a monthly budget"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <select value={form.category_id} onChange={update("category_id")} disabled={!!editingId} required>
                <option value="">Choose a category</option>
                {(editingId ? categories : availableCategories).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Monthly limit</label>
              <input type="number" step="0.01" value={form.monthly_limit} onChange={update("monthly_limit")} required />
            </div>
            <div className="form-field">
              <label>Alert at (%)</label>
              <input type="number" min="1" max="100" value={form.alert_pct} onChange={update("alert_pct")} required />
            </div>
            <button type="submit">{editingId ? "Save" : "Add budget"}</button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : budgetStatus.length === 0 ? (
        <p className="empty-state">No budgets set yet.</p>
      ) : (
        <div className="grid grid-2">
          {budgetStatus.map((status) => (
            <BudgetCard key={status.budget.id} status={status} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
