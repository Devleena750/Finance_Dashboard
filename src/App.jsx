import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"];

const initialData = [
  { id: 1, date: "2026-04-01", amount: 50000, category: "Salary", type: "income" },
  { id: 2, date: "2026-04-02", amount: 1200, category: "Food", type: "expense" },
  { id: 3, date: "2026-04-03", amount: 3000, category: "Shopping", type: "expense" }
];

function useTransactions() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("tx");
    return saved ? JSON.parse(saved) : initialData;
  });

  useEffect(() => {
    localStorage.setItem("tx", JSON.stringify(transactions));
  }, [transactions]);

  const add = () => {
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      amount: Math.floor(Math.random() * 5000),
      category: "Misc",
      type: Math.random() > 0.5 ? "income" : "expense"
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const remove = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  return { transactions, add, remove };
}

export default function App() {
  const { transactions, add, remove } = useTransactions();
  const [role, setRole] = useState("viewer");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() =>
    transactions
      .filter(t => filter === "all" || t.type === filter)
      .filter(t => t.category.toLowerCase().includes(search.toLowerCase())),
    [transactions, search, filter]
  );

  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  const categoryData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type === "expense") map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [transactions]);

  const trendData = transactions.map(t => ({ date: t.date, amount: t.amount }));

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.json";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={exportJSON} className="border px-3 py-1 rounded">Export</button>
            <select value={role} onChange={(e)=>setRole(e.target.value)} className="border p-2">
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Balance" value={balance} />
          <Card title="Income" value={totalIncome} />
          <Card title="Expense" value={totalExpense} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow h-64">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <Line dataKey="amount" stroke="#3b82f6" />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-4">
          <input placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} className="border p-2" />
          <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border p-2">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          {role === "admin" && <button onClick={add} className="bg-black text-white px-4">Add</button>}
        </div>

        <table className="w-full bg-white shadow rounded">
          <thead>
            <tr className="border-b">
              <th>Date</th><th>Category</th><th>Type</th><th>Amount</th>{role==="admin" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b">
                <td>{t.date}</td>
                <td>{t.category}</td>
                <td>{t.type}</td>
                <td>₹{t.amount}</td>
                {role==="admin" && (
                  <td>
                    <button onClick={()=>remove(t.id)} className="text-red-500">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-xl font-bold">₹{value}</p>
    </div>
  );
}
