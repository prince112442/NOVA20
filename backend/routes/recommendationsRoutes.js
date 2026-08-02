// routes/recommendationsRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getPopular, getForMember } = require("../controllers/recommendationsController");

router.get("/popular", requireAuth, getPopular);
router.get("/member/:memberId", requireAuth, getForMember);

module.exports = router;
