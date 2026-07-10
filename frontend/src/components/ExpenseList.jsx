import AccountBadge from "./AccountBadge.jsx";
import CategoryBadge from "./CategoryBadge.jsx";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return <p className="empty-state">No expenses yet. Add one above to get started.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Account</th>
          <th>Source</th>
          <th style={{ textAlign: "right" }}>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense) => (
          <tr key={expense.id}>
            <td>{expense.date}</td>
            <td>{expense.description}</td>
            <td>
              <CategoryBadge category={expense.category} />
            </td>
            <td>
              <AccountBadge account={expense.account} />
            </td>
            <td className="text-muted">{expense.source}</td>
            <td style={{ textAlign: "right" }}>{formatCurrency(expense.amount)}</td>
            <td>
              <div className="form-row" style={{ gap: "0.4rem" }}>
                <button className="secondary" onClick={() => onEdit(expense)}>
                  Edit
                </button>
                <button className="danger" onClick={() => onDelete(expense.id)}>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
