import { useEffect, useState } from "react";

import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseList from "../components/ExpenseList.jsx";
import { createExpense, deleteExpense, getCategories, getExpenses, updateExpense } from "../utils/api.js";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [expenseData, categoryData] = await Promise.all([
        getExpenses({ search, category_id: categoryFilter || undefined }),
        getCategories(),
      ]);
      setExpenses(expenseData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  const handleCreate = async (data) => {
    try {
      await createExpense(data);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateExpense(editing.id, data);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpense(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Expenses</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>{editing ? "Edit expense" : "Add an expense"}</h3>
        <ExpenseForm
          key={editing?.id ?? "new"}
          categories={categories}
          initial={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={editing ? () => setEditing(null) : null}
        />
      </div>

      <div className="card">
        <div className="form-row" style={{ justifyContent: "space-between" }}>
          <h3>All expenses</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Search descriptions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <ExpenseList expenses={expenses} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
