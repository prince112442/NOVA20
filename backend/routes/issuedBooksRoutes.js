// routes/issuedBooksRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getRecent, getAll, issueBook, returnBook } = require("../controllers/issuedBooksController");

router.get("/recent", requireAuth, getRecent);
router.get("/", requireAuth, getAll);
router.post("/", requireAuth, issueBook);
router.put("/:id/return", requireAuth, returnBook);

module.exports = router;
