// controllers/booksController.js
const pool = require("../config/db");

// GET /api/books
async function getAllBooks(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, c.name AS category_name
       FROM books b LEFT JOIN categories c ON b.category_id = c.id
       ORDER BY b.added_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load books" });
  }
}

// GET /api/books/:id
async function getBookById(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM books WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: "Book not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load book" });
  }
}

// POST /api/books
async function createBook(req, res) {
  const { isbn, title, author, category_id, total_copies, shelf_location, cover_url } = req.body;
  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO books (isbn, title, author, category_id, total_copies, available_copies, shelf_location, cover_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [isbn || null, title, author, category_id || null, total_copies || 1, total_copies || 1, shelf_location || null, cover_url || null]
    );
    res.status(201).json({ id: rows[0].id, message: "Book added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not add book" });
  }
}

// PUT /api/books/:id
async function updateBook(req, res) {
  const { title, author, category_id, total_copies, shelf_location, cover_url } = req.body;
  try {
    await pool.query(
      `UPDATE books SET title = $1, author = $2, category_id = $3, total_copies = $4, shelf_location = $5, cover_url = $6
       WHERE id = $7`,
      [title, author, category_id, total_copies, shelf_location, cover_url, req.params.id]
    );
    res.json({ message: "Book updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update book" });
  }
}

// DELETE /api/books/:id
async function deleteBook(req, res) {
  try {
    await pool.query(`DELETE FROM books WHERE id = $1`, [req.params.id]);
    res.json({ message: "Book deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete book" });
  }
}

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };
