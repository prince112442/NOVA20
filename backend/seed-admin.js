// seed-admin.js
// Run once to create your first admin login: node seed-admin.js
// Edit the values below first.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const ADMIN = {
  full_name: "Admin User",
  email: "admin@library.edu",
  password: "ChangeMe123!" // you'll log in with this — change it after first login if you add a "change password" feature
};

(async () => {
  try {
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);

    const { rows: [role] } = await pool.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`);
    if (!role) throw new Error("SUPER_ADMIN role not found — did you run schema.sql?");

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id) VALUES ($1, $2, $3, $4)`,
      [ADMIN.full_name, ADMIN.email, passwordHash, role.id]
    );

    console.log(`Admin created: ${ADMIN.email} / ${ADMIN.password}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await pool.end();
  }
})();
