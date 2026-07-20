import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/budgets?month=7&year=2026
router.get("/", async (req, res) => {
  const { month, year } = req.query;

  try {
    const result = await pool.query(
      `SELECT b.*, c.name AS category_name,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.category_id = b.category_id
            AND t.user_id = b.user_id
            AND EXTRACT(MONTH FROM t.transaction_date) = b.month
            AND EXTRACT(YEAR FROM t.transaction_date) = b.year
            AND t.type = 'expense'
        ), 0) AS spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
       ORDER BY c.name ASC`,
      [req.userId, month, year]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// POST /api/budgets
router.post("/", async (req, res) => {
  const { category_id, monthly_limit, month, year } = req.body;

  if (!category_id || !monthly_limit || !month || !year) {
    return res.status(400).json({ error: "category_id, monthly_limit, month, year are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, monthly_limit, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
       RETURNING *`,
      [req.userId, category_id, monthly_limit, month, year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create/update budget" });
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

export default router;
