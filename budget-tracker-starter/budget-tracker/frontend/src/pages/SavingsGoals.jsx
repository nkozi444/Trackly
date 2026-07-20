import { useEffect, useState } from "react";
import api from "../api/client";
import Layout from "../components/Layout";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
}

function projectCompletionDate(goal) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  if (current <= 0 || current >= target) return null;

  const created = new Date(goal.created_at);
  const now = new Date();
  const daysElapsed = Math.max(1, (now - created) / (1000 * 60 * 60 * 24));
  const ratePerDay = current / daysElapsed;

  if (ratePerDay <= 0) return null;

  const remaining = target - current;
  const daysNeeded = remaining / ratePerDay;
  return new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", target_amount: "", target_date: "" });
  const [contribution, setContribution] = useState({});

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/savings-goals");
      setGoals(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/savings-goals", form);
      setForm({ name: "", target_amount: "", target_date: "" });
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create goal");
    }
  }

  async function handleAddMoney(goal) {
    const amountToAdd = Number(contribution[goal.id]);
    if (!amountToAdd || amountToAdd <= 0) return;

    const newAmount = Number(goal.current_amount) + amountToAdd;
    try {
      await api.put(`/savings-goals/${goal.id}`, { current_amount: newAmount });
      setContribution({ ...contribution, [goal.id]: "" });
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update goal");
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/savings-goals/${id}`);
      loadGoals();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete goal");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Savings Goals</h1>
          <p style={{ margin: "4px 0 0 0" }}>Set a target and watch your progress.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Add a goal</h3>
        <form onSubmit={handleCreate} className="field-row">
          <div>
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. New laptop"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Target amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={form.target_amount}
              onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              required
              min="1"
            />
          </div>
          <div>
            <label>Target date</label>
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
            Add goal
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading ? (
        <p>Loading goals…</p>
      ) : goals.length === 0 ? (
        <div className="empty-state">No savings goals yet. Add one above to get started.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {goals.map((goal) => {
            const target = Number(goal.target_amount);
            const current = Number(goal.current_amount);
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isComplete = current >= target;
            const projected = !isComplete ? projectCompletionDate(goal) : null;

            return (
              <div key={goal.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3>{goal.name}</h3>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(goal.id)}>
                    Delete
                  </button>
                </div>

                <div className="mono" style={{ margin: "10px 0 8px 0", fontSize: 14, color: "var(--ink-soft)" }}>
                  ₱{current.toFixed(2)} of ₱{target.toFixed(2)}
                  {goal.target_date && <> · target: {formatDate(goal.target_date)}</>}
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: isComplete ? "var(--positive)" : "var(--accent)",
                    }}
                  />
                </div>

                <div style={{ fontSize: 12, marginTop: 6, color: "var(--ink-soft)" }}>
                  {pct}%{" "}
                  {isComplete
                    ? "— goal reached"
                    : projected
                    ? `— at this rate, projected to finish around ${formatDate(projected)}`
                    : "— add a contribution to see a projected completion date"}
                </div>

                {!isComplete && (
                  <div className="field-row" style={{ marginTop: 14 }}>
                    <input
                      type="number"
                      placeholder="Add amount"
                      value={contribution[goal.id] || ""}
                      onChange={(e) => setContribution({ ...contribution, [goal.id]: e.target.value })}
                      min="1"
                      style={{ width: 140 }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddMoney(goal)}>
                      Add money
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
