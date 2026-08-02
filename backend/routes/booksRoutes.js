// routes/booksRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getAllBooks, getBookById, createBook, updateBook, deleteBook } = require("../controllers/booksController");

router.get("/", requireAuth, getAllBooks);
router.get("/:id", requireAuth, getBookById);
router.post("/", requireAuth, createBook);
router.put("/:id", requireAuth, updateBook);
router.delete("/:id", requireAuth, deleteBook);

module.exports = router;
