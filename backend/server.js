// server.js — the one file that starts everything.
// Request flow: server.js -> routes/*.js -> middleware/auth.js (checks JWT) -> controllers/*.js -> config/db.js (MySQL)

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const booksRoutes = require("./routes/booksRoutes");
const membersRoutes = require("./routes/membersRoutes");
const issuedBooksRoutes = require("./routes/issuedBooksRoutes");
const finesRoutes = require("./routes/finesRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");

const app = express();

// Allow the frontend's domain(s) to call this API. Set CORS_ORIGIN in .env
// to a comma-separated list, e.g. "https://your-frontend.netlify.app"
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : "*"
}));

app.use(express.json());

// Simple request logger so you can see what's happening in the terminal
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes — each one maps a URL prefix to a routes file
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/issued-books", issuedBooksRoutes);
app.use("/api/fines", finesRoutes);
app.use("/api/recommendations", recommendationsRoutes);

// Health check — useful for confirming the deployed backend is alive
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Fallback for unknown routes
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`LMS backend running on port ${PORT}`));
