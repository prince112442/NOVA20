// controllers/issuedBooksController.js
const pool = require("../config/db");

// GET /api/issued-books/recent  (feeds the dashboard table)
async function getRecent(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.title, m.full_name AS member, ib.issue_date, ib.due_date, ib.status
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.id
       JOIN members m ON ib.member_id = m.id
       ORDER BY ib.issue_date DESC LIMIT 5`
    );
    res.json(rows.map(r => ({
      title: r.title,
      member: r.member,
      issueDate: r.issue_date,
      dueDate: r.due_date,
      status: r.status.charAt(0) + r.status.slice(1).toLowerCase() // ISSUED -> Issued
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load recently issued books" });
  }
}

// GET /api/issued-books  (full list, with optional ?status=)
async function getAll(req, res) {
  try {
    const params = [];
    let sql = `SELECT ib.*, b.title, m.full_name AS member_name
               FROM issued_books ib
               JOIN books b ON ib.book_id = b.id
               JOIN members m ON ib.member_id = m.id`;
    if (req.query.status) {
      params.push(req.query.status.toUpperCase());
      sql += ` WHERE ib.status = $${params.length}`;
    }
    sql += ` ORDER BY ib.issue_date DESC`;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load issued books" });
  }
}

// POST /api/issued-books   { book_id, member_id, due_date }
// Issues a book: creates the loan row and decrements available_copies.
async function issueBook(req, res) {
  const { book_id, member_id, due_date } = req.body;
  if (!book_id || !member_id || !due_date) {
    return res.status(400).json({ message: "book_id, member_id and due_date are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [book] } = await client.query(
      `SELECT available_copies FROM books WHERE id = $1 FOR UPDATE`,
      [book_id]
    );
    if (!book || book.available_copies < 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No copies available for this book" });
    }

    const { rows: [loan] } = await client.query(
      `INSERT INTO issued_books (book_id, member_id, issued_by, issue_date, due_date, status)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'ISSUED') RETURNING id`,
      [book_id, member_id, req.user?.id || null, due_date]
    );
    await client.query(`UPDATE books SET available_copies = available_copies - 1 WHERE id = $1`, [book_id]);

    await client.query("COMMIT");
    res.status(201).json({ id: loan.id, message: "Book issued" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Could not issue book" });
  } finally {
    client.release();
  }
}

// PUT /api/issued-books/:id/return
// Returns a book: marks it returned and increments available_copies.
async function returnBook(req, res) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [loan] } = await client.query(`SELECT * FROM issued_books WHERE id = $1 FOR UPDATE`, [req.params.id]);
    if (!loan) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Loan record not found" });
    }
    if (loan.status === "RETURNED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This book was already returned" });
    }

    await client.query(
      `UPDATE issued_books SET status = 'RETURNED', return_date = CURRENT_DATE WHERE id = $1`,
      [req.params.id]
    );
    await client.query(`UPDATE books SET available_copies = available_copies + 1 WHERE id = $1`, [loan.book_id]);

    await client.query("COMMIT");
    res.json({ message: "Book returned" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Could not process return" });
  } finally {
    client.release();
  }
}

module.exports = { getRecent, getAll, issueBook, returnBook };
