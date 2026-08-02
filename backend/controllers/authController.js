// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong logging in" });
  }
}

module.exports = { login };
