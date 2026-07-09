import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function CategoryChart({ data }) {
  if (data.length === 0) {
    return <p className="empty-state">No spending this month yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category_name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.category_id ?? entry.category_name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
