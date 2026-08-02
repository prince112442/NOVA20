// controllers/membersController.js
const pool = require("../config/db");

// GET /api/members
async function getAllMembers(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM members ORDER BY registered_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load members" });
  }
}

// POST /api/members
async function createMember(req, res) {
  const { member_code, full_name, email, phone, member_type, department } = req.body;
  if (!member_code || !full_name || !email || !member_type) {
    return res.status(400).json({ message: "member_code, full_name, email and member_type are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO members (member_code, full_name, email, phone, member_type, department)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [member_code, full_name, email, phone || null, member_type, department || null]
    );
    res.status(201).json({ id: rows[0].id, message: "Member added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not add member" });
  }
}

// PUT /api/members/:id
async function updateMember(req, res) {
  const { full_name, email, phone, department, status } = req.body;
  try {
    await pool.query(
      `UPDATE members SET full_name = $1, email = $2, phone = $3, department = $4, status = $5 WHERE id = $6`,
      [full_name, email, phone, department, status, req.params.id]
    );
    res.json({ message: "Member updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update member" });
  }
}

// DELETE /api/members/:id
async function deleteMember(req, res) {
  try {
    await pool.query(`DELETE FROM members WHERE id = $1`, [req.params.id]);
    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete member" });
  }
}

module.exports = { getAllMembers, createMember, updateMember, deleteMember };
