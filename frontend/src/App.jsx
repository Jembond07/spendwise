import { Route, Routes } from "react-router-dom";

import Nav from "./components/Nav.jsx";
import Budgets from "./pages/Budgets.jsx";
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
        </Routes>
      </main>
    </div>
  );
}
