// controllers/recommendationsController.js
//
// Simple, explainable recommendation logic — no external AI service needed:
//
//   1. Per-member: look at the categories a member has borrowed from the most,
//      then suggest available books from that category they haven't already
//      borrowed. A brand-new member (no history) falls back to library-wide
//      popularity.
//   2. Library-wide "trending": most-borrowed books overall, for the
//      dashboard widget.
//
const pool = require("../config/db");

// GET /api/recommendations/popular
// General "trending" list — doesn't need a member, good for a dashboard widget.
async function getPopular(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.title, b.author, c.name AS category, b.available_copies,
              COUNT(ib.id)::int AS times_issued
       FROM books b
       LEFT JOIN issued_books ib ON ib.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.available_copies > 0
       GROUP BY b.id, c.name
       ORDER BY times_issued DESC, b.added_at DESC
       LIMIT 6`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load popular books" });
  }
}

// GET /api/recommendations/member/:memberId
// Personalized: matches the member's most-borrowed category, excludes books
// they already have, falls back to popularity if there's no history yet.
async function getForMember(req, res) {
  const { memberId } = req.params;

  try {
    const { rows: [topCategory] } = await pool.query(
      `SELECT b.category_id, COUNT(*)::int AS cnt
       FROM issued_books ib JOIN books b ON ib.book_id = b.id
       WHERE ib.member_id = $1
       GROUP BY b.category_id
       ORDER BY cnt DESC LIMIT 1`,
      [memberId]
    );

    if (topCategory) {
      const { rows } = await pool.query(
        `SELECT b.id, b.title, b.author, c.name AS category, b.available_copies
         FROM books b LEFT JOIN categories c ON b.category_id = c.id
         WHERE b.category_id = $1
           AND b.available_copies > 0
           AND b.id NOT IN (SELECT book_id FROM issued_books WHERE member_id = $2)
         ORDER BY b.available_copies DESC
         LIMIT 6`,
        [topCategory.category_id, memberId]
      );
      if (rows.length) {
        return res.json({ basis: "borrowing history", books: rows });
      }
    }

    // Fallback: no history yet, or nothing left to suggest in their favorite category
    const { rows: popular } = await pool.query(
      `SELECT b.id, b.title, b.author, c.name AS category, b.available_copies,
              COUNT(ib.id)::int AS times_issued
       FROM books b
       LEFT JOIN issued_books ib ON ib.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.available_copies > 0
         AND b.id NOT IN (SELECT book_id FROM issued_books WHERE member_id = $1)
       GROUP BY b.id, c.name
       ORDER BY times_issued DESC, b.added_at DESC
       LIMIT 6`,
      [memberId]
    );
    res.json({ basis: "popularity", books: popular });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load recommendations" });
  }
}

module.exports = { getPopular, getForMember };
