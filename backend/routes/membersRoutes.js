// routes/membersRoutes.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getAllMembers, createMember, updateMember, deleteMember } = require("../controllers/membersController");

router.get("/", requireAuth, getAllMembers);
router.post("/", requireAuth, createMember);
router.put("/:id", requireAuth, updateMember);
router.delete("/:id", requireAuth, deleteMember);

module.exports = router;
