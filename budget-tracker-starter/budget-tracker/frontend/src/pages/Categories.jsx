import { useEffect, useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import api from "../api/client";
import Layout from "../components/Layout";

function CategoryRow({ category, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/categories/${category.id}`, { name: name.trim() });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(category.name);
    setError("");
    setEditing(false);
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <span className={"badge " + (category.type === "income" ? "badge-income" : "badge-expense")} style={{ marginRight: 8, flexShrink: 0 }}>
            {category.type}
          </span>
          {editing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : (
            <span>{category.name}</span>
          )}
        </span>

        {editing ? (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saving} title="Save">
              <Check size={14} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancel} title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} title="Edit name">
              <Pencil size={14} />
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(category.id)} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", type: "expense" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/categories", form);
      setForm({ name: "", type: "expense" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create category");
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete category");
    }
  }

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p style={{ margin: "4px 0 0 0" }}>Group your transactions so budgets and charts mean something.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Add a category</h3>
        <form onSubmit={handleCreate} className="field-row">
          <div>
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Groceries"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
            Add category
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading ? (
        <p>Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="empty-state">No categories yet. Add one above — you'll use it when logging transactions.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Income</h3>
            {income.length === 0 ? (
              <p style={{ fontSize: 13 }}>None yet.</p>
            ) : (
              income.map((c) => (
                <CategoryRow key={c.id} category={c} onSaved={load} onDelete={handleDelete} />
              ))
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Expense</h3>
            {expense.length === 0 ? (
              <p style={{ fontSize: 13 }}>None yet.</p>
            ) : (
              expense.map((c) => (
                <CategoryRow key={c.id} category={c} onSaved={load} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
