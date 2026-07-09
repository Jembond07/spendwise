import { useState } from "react";

import { importCsv } from "../utils/api.js";

export default function Import() {
  const [file, setFile] = useState(null);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importCsv(file, autoCategorize);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Import bank CSV</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>CSV file</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0] ?? null)}
                required
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={autoCategorize}
                onChange={(e) => setAutoCategorize(e.target.checked)}
              />
              Auto-categorize with AI
            </label>
            <button type="submit" disabled={uploading || !file}>
              {uploading ? "Importing…" : "Import"}
            </button>
          </div>
        </form>
        <p className="text-muted" style={{ marginTop: "0.75rem" }}>
          Expects columns for date, description, and amount (or separate debit/credit columns).
          Most common bank export formats are auto-detected.
        </p>
      </div>

      {result && (
        <div className="card">
          <h3>Import result</h3>
          <p>
            Imported <strong>{result.imported}</strong> expenses, skipped{" "}
            <strong>{result.skipped}</strong> rows.
          </p>
          {result.errors.length > 0 && (
            <ul className="text-muted">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
