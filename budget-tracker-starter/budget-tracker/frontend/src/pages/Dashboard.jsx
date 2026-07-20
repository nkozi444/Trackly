import { useEffect, useState } from "react";
import api from "../api/client";
import Layout from "../components/Layout";

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ amount: "", type: "expense", category_id: "", description: "" });

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch {
      // categories are optional for the form; fail silently here
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/transactions", form);
      setForm({ amount: "", type: "expense", category_id: "", description: "" });
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add transaction");
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/transactions/${id}`);
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete transaction");
    }
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p style={{ margin: "4px 0 0 0" }}>Everything coming in and going out.</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value positive mono">₱{totalIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value negative mono">₱{totalExpense.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Balance</div>
          <div className={"stat-value mono " + (balance >= 0 ? "positive" : "negative")}>
            ₱{balance.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Add a transaction</h3>
        <form onSubmit={handleAdd} className="field-row">
          <div>
            <label>Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label>Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Description</label>
            <input
              type="text"
              placeholder="Optional"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
            Add
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading ? (
        <p>Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <div className="empty-state">No transactions yet. Add your first one above.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{new Date(t.transaction_date).toLocaleDateString()}</td>
                  <td>
                    <span className={"badge " + (t.type === "income" ? "badge-income" : "badge-expense")}>
                      {t.type}
                    </span>
                  </td>
                  <td>{t.category_name || "—"}</td>
                  <td>{t.description || "—"}</td>
                  <td
                    className={"mono " + (t.type === "income" ? "amount-positive" : "amount-negative")}
                    style={{ textAlign: "right" }}
                  >
                    {t.type === "income" ? "+" : "−"}₱{Number(t.amount).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
