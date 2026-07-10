import { useEffect, useState } from "react";

import CategoryBadge from "../components/CategoryBadge.jsx";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../utils/api.js";

const emptyForm = { name: "", color: "#6366f1", icon: "tag", ai_keywords: "" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      const payload = {
        name: form.name,
        color: form.color,
        icon: form.icon,
        ai_keywords: form.ai_keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      color: category.color,
      icon: category.icon,
      ai_keywords: category.ai_keywords.join(", "),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Categories</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>{editingId ? "Edit category" : "Add a category"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Name</label>
              <input type="text" value={form.name} onChange={update("name")} placeholder="e.g. Subscriptions" required />
            </div>
            <div className="form-field">
              <label>Color</label>
              <input type="color" value={form.color} onChange={update("color")} style={{ padding: "0.2rem", height: "2.4rem", width: "3.5rem" }} />
            </div>
            <div className="form-field">
              <label>Icon</label>
              <input type="text" value={form.icon} onChange={update("icon")} placeholder="tag" />
            </div>
            <div className="form-field" style={{ flex: 1, minWidth: 220 }}>
              <label>AI keywords (comma separated)</label>
              <input
                type="text"
                value={form.ai_keywords}
                onChange={update("ai_keywords")}
                placeholder="e.g. netflix, spotify, hulu"
              />
            </div>
            <button type="submit">{editingId ? "Save" : "Add category"}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="empty-state">No categories yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Keywords</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <CategoryBadge category={category} />
                  </td>
                  <td className="text-muted">{category.ai_keywords.join(", ") || "—"}</td>
                  <td>
                    <div className="form-row" style={{ gap: "0.4rem" }}>
                      <button className="secondary" onClick={() => handleEdit(category)}>
                        Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(category.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
