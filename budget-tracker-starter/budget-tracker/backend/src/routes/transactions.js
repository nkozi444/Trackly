import { Router } from "express";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/transactions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name AS category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC, t.id DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// POST /api/transactions
router.post("/", async (req, res) => {
  const { amount, type, category_id, description, transaction_date, is_recurring } = req.body;

  if (!amount || !type) {
    return res.status(400).json({ error: "amount and type are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date, is_recurring)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), COALESCE($7, false))
       RETURNING *`,
      [req.userId, category_id || null, amount, type, description || null, transaction_date, is_recurring]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// PUT /api/transactions/:id
router.put("/:id", async (req, res) => {
  const { amount, type, category_id, description, transaction_date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category_id = COALESCE($3, category_id),
           description = COALESCE($4, description),
           transaction_date = COALESCE($5, transaction_date)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [amount, type, category_id, description, transaction_date, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// DELETE /api/transactions/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
