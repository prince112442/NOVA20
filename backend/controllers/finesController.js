// controllers/finesController.js
const pool = require("../config/db");

// GET /api/fines?status=UNPAID
async function getAll(req, res) {
  try {
    const params = [];
    let sql = `SELECT f.*, m.full_name AS member_name
               FROM fines f JOIN members m ON f.member_id = m.id`;
    if (req.query.status) {
      params.push(req.query.status.toUpperCase());
      sql += ` WHERE f.status = $${params.length}`;
    }
    sql += ` ORDER BY f.created_at DESC`;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load fines" });
  }
}

// PUT /api/fines/:id/pay
async function markPaid(req, res) {
  try {
    await pool.query(`UPDATE fines SET status = 'PAID', paid_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: "Fine marked as paid" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update fine" });
  }
}

module.exports = { getAll, markPaid };
