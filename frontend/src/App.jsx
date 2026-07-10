import { Route, Routes } from "react-router-dom";

import Nav from "./components/Nav.jsx";
import Accounts from "./pages/Accounts.jsx";
import Budgets from "./pages/Budgets.jsx";
import Categories from "./pages/Categories.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Import from "./pages/Import.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/import" element={<Import />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/accounts" element={<Accounts />} />
        </Routes>
      </main>
    </div>
  );
}
