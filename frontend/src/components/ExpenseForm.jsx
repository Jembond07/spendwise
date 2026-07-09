import { useState } from "react";

import { categorizeExpense } from "../utils/api";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d - offset).toISOString().slice(0, 10);
};

const emptyForm = { amount: "", description: "", category_id: "", date: today() };

export default function ExpenseForm({ categories, onSubmit, initial, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : emptyForm);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSuggest = async () => {
    if (!form.description) return;
    setSuggesting(true);
    setError(null);
    try {
      const result = await categorizeExpense(form.description);
      if (result.category_id) {
        setForm((f) => ({ ...f, category_id: result.category_id }));
      } else {
        setError("No confident category match found.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.date) return;
    onSubmit({
      amount: parseFloat(form.amount),
      description: form.description,
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      date: form.date,
    });
    if (!initial) setForm(emptyForm);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-row">
        <div className="form-field">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={update("amount")}
            placeholder="0.00"
            required
          />
        </div>
        <div className="form-field" style={{ flex: 1, minWidth: 200 }}>
          <label>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={update("description")}
            placeholder="e.g. Whole Foods"
            required
          />
        </div>
        <div className="form-field">
          <label>Category</label>
          <select value={form.category_id ?? ""} onChange={update("category_id")}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={update("date")} required />
        </div>
        <button type="button" className="secondary" onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? "Thinking…" : "Suggest category"}
        </button>
        <button type="submit">{initial ? "Save" : "Add expense"}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
