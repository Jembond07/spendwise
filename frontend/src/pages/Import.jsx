import { useEffect, useState } from "react";

import { getAccounts, importCsv } from "../utils/api.js";

export default function Import() {
  const [accounts, setAccounts] = useState([]);
  const [pending, setPending] = useState([]); // [{ file, accountId }]
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [results, setResults] = useState([]); // [{ filename, ...ImportResult }] | { filename, error }
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((err) => setError(err.message));
  }, []);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files ?? []);
    setPending((prev) => [
      ...prev,
      ...files.map((file) => ({ file, accountId: accounts[0]?.id ?? "" })),
    ]);
    e.target.value = "";
  };

  const updatePendingAccount = (index, accountId) =>
    setPending((prev) => prev.map((p, i) => (i === index ? { ...p, accountId } : p)));

  const removePending = (index) => setPending((prev) => prev.filter((_, i) => i !== index));

  const handleImportAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setError(null);
    const newResults = [];
    for (const { file, accountId } of pending) {
      try {
        const res = await importCsv(file, autoCategorize, accountId || undefined);
        newResults.push({ filename: file.name, ...res });
      } catch (err) {
        newResults.push({ filename: file.name, error: err.message });
      }
    }
    setResults(newResults);
    setPending([]);
    setUploading(false);
  };

  return (
    <div>
      <h2>Import bank CSV</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="form-row">
          <div className="form-field">
            <label>CSV file(s)</label>
            <input type="file" accept=".csv" multiple onChange={handleFilesSelected} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="checkbox"
              checked={autoCategorize}
              onChange={(e) => setAutoCategorize(e.target.checked)}
            />
            Auto-categorize with AI
          </label>
        </div>
        <p className="text-muted" style={{ marginTop: "0.75rem" }}>
          Select one file per account (e.g. checking, credit card, investment) — you can pick
          multiple at once and assign each its own account below. Re-importing the same
          statement skips transactions already in that account.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <h3>Files to import</h3>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Account</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, i) => (
                <tr key={`${p.file.name}-${i}`}>
                  <td>{p.file.name}</td>
                  <td>
                    <select value={p.accountId} onChange={(e) => updatePendingAccount(i, e.target.value)}>
                      <option value="">No account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="secondary" onClick={() => removePending(i)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ marginTop: "0.75rem" }} onClick={handleImportAll} disabled={uploading}>
            {uploading ? "Importing…" : `Import ${pending.length} file${pending.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h3>Import results</h3>
          {results.map((r, i) => (
            <div key={i} style={{ marginBottom: i < results.length - 1 ? "1rem" : 0 }}>
              <strong>{r.filename}</strong>
              {r.error ? (
                <p className="error-banner" style={{ marginTop: "0.4rem" }}>{r.error}</p>
              ) : (
                <>
                  <p style={{ margin: "0.25rem 0" }}>
                    Imported <strong>{r.imported}</strong>, skipped{" "}
                    <strong>{r.duplicates}</strong> duplicate{r.duplicates === 1 ? "" : "s"}
                    {r.skipped > 0 && (
                      <>
                        {" "}
                        and <strong>{r.skipped}</strong> unparseable row{r.skipped === 1 ? "" : "s"}
                      </>
                    )}
                    .
                  </p>
                  {r.errors?.length > 0 && (
                    <ul className="text-muted">
                      {r.errors.map((err, j) => (
                        <li key={j}>{err}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
