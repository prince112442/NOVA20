-- ============================================================
-- Automated University Library Management System
-- PostgreSQL 14+ schema
--
-- Create the database first (most hosted providers — Supabase,
-- Neon, Railway — already give you one), then run this file
-- against it, e.g.:
--   psql "your-connection-string" -f schema.sql
-- ============================================================

-- ---------- Roles & Users (staff/admin login) ----------
CREATE TABLE IF NOT EXISTS roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE   -- SUPER_ADMIN, LIBRARIAN, STAFF
);

CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role_id         BIGINT NOT NULL REFERENCES roles(id),
    avatar_url      VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Members (Students / Teachers who borrow books) ----------
CREATE TABLE IF NOT EXISTS members (
    id              BIGSERIAL PRIMARY KEY,
    member_code     VARCHAR(30) NOT NULL UNIQUE,     -- e.g. student/staff ID
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(30),
    member_type     VARCHAR(20) NOT NULL CHECK (member_type IN ('STUDENT','TEACHER','STAFF')),
    department      VARCHAR(120),
    photo_url       VARCHAR(255),
    status          VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED','INACTIVE')),
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Books ----------
CREATE TABLE IF NOT EXISTS categories (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(80) NOT NULL UNIQUE          -- Fiction, Programming, Self Help...
);

CREATE TABLE IF NOT EXISTS books (
    id              BIGSERIAL PRIMARY KEY,
    isbn            VARCHAR(20) UNIQUE,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(150) NOT NULL,
    category_id     BIGINT REFERENCES categories(id),
    cover_url       VARCHAR(255),
    total_copies    INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    shelf_location  VARCHAR(50),
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Issued / Returned Books ----------
CREATE TABLE IF NOT EXISTS issued_books (
    id              BIGSERIAL PRIMARY KEY,
    book_id         BIGINT NOT NULL REFERENCES books(id),
    member_id       BIGINT NOT NULL REFERENCES members(id),
    issued_by       BIGINT REFERENCES users(id),      -- staff user who processed it
    issue_date      DATE NOT NULL,
    due_date        DATE NOT NULL,
    return_date     DATE NULL,
    status          VARCHAR(20) DEFAULT 'ISSUED' CHECK (status IN ('ISSUED','RETURNED','OVERDUE'))
);

-- ---------- Book Requests (hold/reservation queue) ----------
CREATE TABLE IF NOT EXISTS book_requests (
    id              BIGSERIAL PRIMARY KEY,
    book_id         BIGINT NOT NULL REFERENCES books(id),
    member_id       BIGINT NOT NULL REFERENCES members(id),
    requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','FULFILLED'))
);

-- ---------- Fines ----------
CREATE TABLE IF NOT EXISTS fines (
    id              BIGSERIAL PRIMARY KEY,
    issued_book_id  BIGINT NOT NULL REFERENCES issued_books(id),
    member_id       BIGINT NOT NULL REFERENCES members(id),
    amount          DECIMAL(10,2) NOT NULL,
    reason          VARCHAR(255) DEFAULT 'Overdue return',
    status          VARCHAR(20) DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID','WAIVED')),
    paid_at         TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Activity log (for the "Recent Activity" feed) ----------
CREATE TABLE IF NOT EXISTS activity_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_name      VARCHAR(120) NOT NULL,
    action          VARCHAR(255) NOT NULL,        -- e.g. "issued 'The Alchemist'"
    entity_type     VARCHAR(50),                  -- BOOK, MEMBER, FINE
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Helpful indexes ----------
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_issued_status ON issued_books(status);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type);

-- ---------- Seed roles ----------
INSERT INTO roles (name) VALUES ('SUPER_ADMIN'), ('LIBRARIAN'), ('STAFF')
ON CONFLICT (name) DO NOTHING;
