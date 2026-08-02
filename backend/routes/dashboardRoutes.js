// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getStats, getBooksOverview, getActivity, getTopBooks } = require("../controllers/dashboardController");

router.get("/stats", requireAuth, getStats);
router.get("/books-overview", requireAuth, getBooksOverview);
router.get("/activity", requireAuth, getActivity);
router.get("/top-books", requireAuth, getTopBooks);

module.exports = router;
