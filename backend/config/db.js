// config/db.js
// One shared connection pool. Every route reuses this — no manual connect/disconnect.
//
// Two ways to configure it:
//   1. DATABASE_URL — a single connection string (what Render/Railway/Supabase/Neon give you)
//   2. DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME — separate fields (handy for local dev)

require("dotenv").config();
const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

module.exports = pool;
