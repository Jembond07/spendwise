import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (n) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function SpendingChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
        <XAxis dataKey="month" stroke="#64748b" />
        <YAxis stroke="#64748b" tickFormatter={(v) => formatCurrency(v)} width={80} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
