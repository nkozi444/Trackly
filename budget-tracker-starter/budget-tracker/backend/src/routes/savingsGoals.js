import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/savings-goals
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

// POST /api/savings-goals
router.post("/", async (req, res) => {
  const { name, target_amount, target_date } = req.body;

  if (!name || !target_amount) {
    return res.status(400).json({ error: "name and target_amount are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, target_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, name, target_amount, target_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

// PUT /api/savings-goals/:id  (e.g., add money toward goal)
router.put("/:id", async (req, res) => {
  const { current_amount, name, target_amount, target_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE savings_goals
       SET current_amount = COALESCE($1, current_amount),
           name = COALESCE($2, name),
           target_amount = COALESCE($3, target_amount),
           target_date = COALESCE($4, target_date)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [current_amount, name, target_amount, target_date, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Savings goal not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

// DELETE /api/savings-goals/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Savings goal not found" });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

export default router;
