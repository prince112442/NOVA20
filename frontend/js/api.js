/**
 * api.js — thin wrapper around the Node/Express REST API.
 *
 * Set API_BASE_URL to your deployed backend, e.g.
 *   https://lms-api.onrender.com/api
 * Locally during development point it at http://localhost:8080/api
 *
 * All requests attach the JWT saved at login (localStorage "lms_token").
 * There is no built-in sample data here — if a request fails (backend not
 * running yet, wrong URL, expired token) it throws, and app.js is
 * responsible for showing an empty/error state instead of fake numbers.
 */

const API_BASE_URL = "https://YOUR-BACKEND-DOMAIN/api"; // <-- change this after deploying the backend

function authHeaders() {
  const token = localStorage.getItem("lms_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() }
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

// ---------- Data functions the UI calls — no fallback/sample data ----------
function fetchStats() {
  return apiGet("/dashboard/stats");
}
function fetchBooksOverview(range = "week") {
  return apiGet(`/dashboard/books-overview?range=${range}`);
}
function fetchRecentActivity() {
  return apiGet("/dashboard/activity");
}
function fetchRecentIssuedBooks() {
  return apiGet("/issued-books/recent");
}
function fetchTopBooks() {
  return apiGet("/dashboard/top-books");
}
function fetchPopularRecommendations() {
  return apiGet("/recommendations/popular");
}
