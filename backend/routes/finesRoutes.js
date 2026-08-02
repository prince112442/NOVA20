// routes/finesRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getAll, markPaid } = require("../controllers/finesController");

router.get("/", requireAuth, getAll);
router.put("/:id/pay", requireAuth, markPaid);

module.exports = router;
