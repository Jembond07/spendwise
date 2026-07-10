import { useEffect, useState } from "react";

import AccountBadge from "../components/AccountBadge.jsx";
import { createAccount, deleteAccount, getAccounts, updateAccount } from "../utils/api.js";

const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment", "other"];

const emptyForm = { name: "", type: "checking", color: "#0ea5e9" };

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setAccounts(await getAccounts());
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
      if (editingId) {
        await updateAccount(editingId, form);
      } else {
        await createAccount(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setForm({ name: account.name, type: account.type, color: account.color });
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Accounts</h2>
      <p className="text-muted" style={{ marginTop: "-0.5rem" }}>
        Tag expenses by where they came from — checking, credit card, savings, investments.
      </p>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3>{editingId ? "Edit account" : "Add an account"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Name</label>
              <input type="text" value={form.name} onChange={update("name")} placeholder="e.g. Chase Checking" required />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select value={form.type} onChange={update("type")}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Color</label>
              <input type="color" value={form.color} onChange={update("color")} style={{ padding: "0.2rem", height: "2.4rem", width: "3.5rem" }} />
            </div>
            <button type="submit">{editingId ? "Save" : "Add account"}</button>
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
        ) : accounts.length === 0 ? (
          <p className="empty-state">No accounts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <AccountBadge account={account} />
                  </td>
                  <td className="text-muted">{account.type}</td>
                  <td>
                    <div className="form-row" style={{ gap: "0.4rem" }}>
                      <button className="secondary" onClick={() => handleEdit(account)}>
                        Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(account.id)}>
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
