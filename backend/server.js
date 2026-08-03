// server.js — the one file that starts everything.
// Request flow: server.js -> routes/*.js -> middleware/auth.js -> controllers/*.js -> config/db.js

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


// ===============================
// CORS CONFIGURATION
// ===============================

const allowedOrigins = [
  "https://novalms.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
}));


// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());


// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});


// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/books", booksRoutes);

app.use("/api/members", membersRoutes);

app.use("/api/issued-books", issuedBooksRoutes);

app.use("/api/fines", finesRoutes);

app.use("/api/recommendations", recommendationsRoutes);


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok"
  });
});


// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});


// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Unexpected server error"
  });
});


// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`LMS backend running on port ${PORT}`);
});