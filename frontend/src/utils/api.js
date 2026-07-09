const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Categories
export const getCategories = () => request("/categories");
export const createCategory = (data) =>
  request("/categories", { method: "POST", body: JSON.stringify(data) });
export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: "DELETE" });

// Expenses
export const getExpenses = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return request(`/expenses${query ? `?${query}` : ""}`);
};
export const createExpense = (data) =>
  request("/expenses", { method: "POST", body: JSON.stringify(data) });
export const updateExpense = (id, data) =>
  request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteExpense = (id) => request(`/expenses/${id}`, { method: "DELETE" });

// CSV import
export const importCsv = (file, autoCategorize) => {
  const form = new FormData();
  form.append("file", file);
  return request(`/import/csv?auto_categorize=${autoCategorize}`, {
    method: "POST",
    body: form,
  });
};

// Categorize
export const categorizeExpense = (description) =>
  request("/categorize", { method: "POST", body: JSON.stringify({ description }) });

// Budgets
export const getBudgets = () => request("/budgets");
export const createBudget = (data) =>
  request("/budgets", { method: "POST", body: JSON.stringify(data) });
export const updateBudget = (id, data) =>
  request(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteBudget = (id) => request(`/budgets/${id}`, { method: "DELETE" });

// Dashboard
export const getDashboard = () => request("/dashboard");
