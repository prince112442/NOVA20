# Automated Library Management System

## What's in this build
- `frontend/` — plain HTML/CSS/JS dashboard (no build step, no framework)
  - `index.html` + `css/style.css` — the dashboard shown in the screenshot
  - `login.html` — login screen that gets a JWT from the backend
  - `js/api.js` — talks to your Node/Express REST API; no built-in sample data, shows a simple empty state if the API isn't reachable
  - `js/app.js` — renders stat cards, charts (Chart.js via CDN), tables, and the recommendations widget
- `backend/` — Node.js + Express + PostgreSQL API (see below)
- `backend-sql/schema.sql` — PostgreSQL schema: users, roles, members, books, categories, issued_books, book_requests, fines, activity_log

## Backend: Node.js + Express + PostgreSQL
Plain and traceable on purpose — no framework magic, no annotations. Every request follows the same path:

```
server.js → routes/*.js → middleware/auth.js (checks the JWT) → controllers/*.js (plain SQL via pg) → PostgreSQL
```

`backend/` structure:
- `server.js` — starts the app, wires up all routes, one place to see the whole API
- `config/db.js` — the PostgreSQL connection pool everything shares (accepts either a single `DATABASE_URL` or separate `DB_*` fields)
- `middleware/auth.js` — one function, `requireAuth`, that checks the `Authorization: Bearer <token>` header
- `controllers/` — one file per feature (auth, dashboard, books, members, issued-books, fines, recommendations), each just a handful of `async function`s that run a SQL query and return JSON
- `routes/` — maps URLs to controller functions, nothing else
- `seed-admin.js` — run once to create your first login
- `seed-books.js` — run once to load a starter catalog of real books, ready to lend

A note on types: PostgreSQL's driver returns `BIGINT`/`NUMERIC` columns as strings (so large numbers don't silently lose precision), so anywhere the frontend needs a plain number — counts, sums — the SQL casts it explicitly (`::int`, `::float8`). You'll see that in `dashboardController.js` and `recommendationsController.js`.

### Endpoints
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/dashboard/stats` / `books-overview` / `activity` / `top-books`
- `GET/POST/PUT/DELETE /api/books`, `/api/members`
- `GET /api/issued-books`, `/api/issued-books/recent`, `POST /api/issued-books` (issue), `PUT /api/issued-books/:id/return`
- `GET /api/fines`, `PUT /api/fines/:id/pay`
- `GET /api/recommendations/popular` — trending books library-wide (feeds the dashboard widget)
- `GET /api/recommendations/member/:memberId` — personalized picks for one member, based on the category they borrow from most; falls back to popularity if they're new

### How the recommendations work
No external AI service, no API keys — just two SQL-driven strategies, both explainable:
1. **Personalized**: finds the category a member has borrowed from most, suggests available books from that category they don't already have out.
2. **Popularity fallback**: for brand-new members (no borrowing history yet) or when their favorite category is exhausted, it suggests the most-borrowed books library-wide.

This keeps the stack simple (nothing beyond Node + PostgreSQL) while still giving genuinely useful, personalized suggestions.

### Running it locally
```bash
cd backend
npm install
cp .env.example .env      # fill in your Postgres credentials (or DATABASE_URL) + a JWT_SECRET
psql -U postgres -d lms_db -f ../backend-sql/schema.sql
node seed-admin.js        # creates admin@library.edu / ChangeMe123!
node seed-books.js        # adds ~25 real books across 6 categories, ready to lend
npm run dev                # starts on http://localhost:8080
```
(Create the `lms_db` database first if it doesn't exist: `createdb lms_db`.)

Then open `frontend/login.html` (with `API_BASE_URL` set to `http://localhost:8080/api`) and log in with the seeded admin.

## Database
Run `backend-sql/schema.sql` against PostgreSQL 14+, then `node seed-books.js` to load real starter data. Point `backend/.env` at your database — either one `DATABASE_URL` connection string, or the separate `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` fields.

## Hosting online (recommended, all free-tier friendly)
| Piece | Where | Why |
|---|---|---|
| Frontend (`frontend/`) | **Netlify** or **Vercel** (drag-and-drop or GitHub deploy) | Static HTML/CSS/JS, deploys in seconds, free HTTPS |
| Backend (Node/Express) | **Render** or **Railway** (deploy straight from a GitHub repo, no Dockerfile needed) | Auto-detects `npm start`, free tier, gives you a public HTTPS URL |
| Database (PostgreSQL) | **Supabase**, **Neon**, or **Railway Postgres** | All have generous free tiers and hand you a ready-to-use `DATABASE_URL` |

Steps:
1. Create a Postgres database on Supabase/Neon/Railway and copy its `DATABASE_URL`.
2. Run `backend-sql/schema.sql` against it — most of these providers have a SQL editor in their dashboard where you can paste and run it, or use `psql "your-connection-string" -f schema.sql`.
3. Push the `backend/` folder to a GitHub repo, connect it to Render/Railway, and set the environment variables from `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`) in their dashboard.
4. Run `node seed-admin.js` and `node seed-books.js` once (Render/Railway both let you run one-off commands) to create your first login and load the starter catalog.
5. Copy the backend's public URL (e.g. `https://lms-api.onrender.com/api`) into `API_BASE_URL` in `frontend/js/api.js` and `frontend/login.html`.
6. Deploy the `frontend/` folder to Netlify/Vercel as a static site.
7. Set `CORS_ORIGIN` on the backend to your deployed frontend's URL.

## Next steps for the dashboard itself
- Wire the "Add Book" / "Add Member" / "Issue Book" / "Return Book" quick action buttons in `app.js` to real forms or pages once the corresponding controllers exist.
- Build out the other sidebar sections (Books, Users, Students, Teachers, Fine Management, Reports) the same way: one HTML page + fetch calls to their own endpoints.
