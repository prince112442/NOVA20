// controllers/dashboardController.js
//
// Note on types: node-postgres returns BIGINT/NUMERIC columns as strings
// (to avoid silent precision loss), so aggregates below are cast to ::int
// or ::float8 in SQL wherever the frontend expects a plain number.
const pool = require("../config/db");

// GET /api/dashboard/stats
async function getStats(req, res) {
  try {
    const { rows: [{ total_members }] } = await pool.query(
      `SELECT COUNT(*)::int AS total_members FROM members`
    );
    const { rows: [{ issued_books }] } = await pool.query(
      `SELECT COUNT(*)::int AS issued_books FROM issued_books WHERE status IN ('ISSUED','OVERDUE')`
    );
    const { rows: [{ total_books }] } = await pool.query(
      `SELECT COALESCE(SUM(total_copies),0)::int AS total_books FROM books`
    );
    const { rows: [{ total_fine }] } = await pool.query(
      `SELECT COALESCE(SUM(amount),0)::float8 AS total_fine FROM fines WHERE status = 'UNPAID'`
    );

    // Month-over-month deltas are optional polish — wire these up once you have
    // historical snapshots. For now they default to 0 so the UI still renders.
    res.json({
      totalMembers: total_members, membersDelta: 0,
      issuedBooks: issued_books, issuedDelta: 0,
      totalBooks: total_books, totalBooksDelta: 0,
      totalFine: total_fine, fineDelta: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load dashboard stats" });
  }
}

// GET /api/dashboard/books-overview?range=week
async function getBooksOverview(req, res) {
  const days = req.query.range === "month" ? 30 : req.query.range === "year" ? 365 : 7;

  try {
    const { rows: issuedRows } = await pool.query(
      `SELECT issue_date AS day, COUNT(*)::int AS count
       FROM issued_books
       WHERE issue_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
       GROUP BY issue_date ORDER BY day`,
      [days]
    );
    const { rows: returnedRows } = await pool.query(
      `SELECT return_date AS day, COUNT(*)::int AS count
       FROM issued_books
       WHERE return_date IS NOT NULL AND return_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
       GROUP BY return_date ORDER BY day`,
      [days]
    );

    res.json({
      labels: issuedRows.map(r => r.day),
      issued: issuedRows.map(r => r.count),
      returned: returnedRows.map(r => r.count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load books overview" });
  }
}

// GET /api/dashboard/activity
async function getActivity(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT actor_name, action, created_at
       FROM activity_log ORDER BY created_at DESC LIMIT 5`
    );
    res.json(rows.map(r => ({
      iconName: "check",
      text: `${r.actor_name} ${r.action}`,
      time: r.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load recent activity" });
  }
}

// GET /api/dashboard/top-books  (by category, matching the donut chart)
async function getTopBooks(req, res) {
  const colors = ["#e2833f", "#1b1f45", "#c96f2e", "#363c78", "#f0a868"];
  try {
    const { rows } = await pool.query(
      `SELECT c.name, SUM(b.total_copies)::int AS value
       FROM books b JOIN categories c ON b.category_id = c.id
       GROUP BY c.name ORDER BY value DESC LIMIT 5`
    );
    res.json(rows.map((r, i) => ({ name: r.name, value: r.value, color: colors[i % colors.length] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load top books" });
  }
}

module.exports = { getStats, getBooksOverview, getActivity, getTopBooks };
