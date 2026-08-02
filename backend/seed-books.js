// seed-books.js
// Populates categories + a starter catalog of real books so the system
// isn't empty on first run. Run once: node seed-books.js

require("dotenv").config();
const pool = require("./config/db");

const CATEGORIES = ["Fiction", "Programming", "Self Help", "Science", "Business", "History"];

const BOOKS = [
  { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", copies: 4 },
  { title: "1984", author: "George Orwell", category: "Fiction", copies: 3 },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", copies: 3 },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction", copies: 2 },
  { title: "Things Fall Apart", author: "Chinua Achebe", category: "Fiction", copies: 3 },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", category: "Fiction", copies: 2 },

  { title: "Clean Code", author: "Robert C. Martin", category: "Programming", copies: 3 },
  { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", category: "Programming", copies: 2 },
  { title: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "Programming", copies: 3 },
  { title: "Design Patterns", author: "Erich Gamma et al.", category: "Programming", copies: 2 },
  { title: "Cracking the Coding Interview", author: "Gayle Laakmann McDowell", category: "Programming", copies: 4 },
  { title: "Database System Concepts", author: "Abraham Silberschatz", category: "Programming", copies: 2 },

  { title: "Atomic Habits", author: "James Clear", category: "Self Help", copies: 5 },
  { title: "The 5 AM Club", author: "Robin Sharma", category: "Self Help", copies: 2 },
  { title: "Deep Work", author: "Cal Newport", category: "Self Help", copies: 3 },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", category: "Self Help", copies: 3 },

  { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", copies: 2 },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "Science", copies: 4 },
  { title: "The Selfish Gene", author: "Richard Dawkins", category: "Science", copies: 2 },
  { title: "Cosmos", author: "Carl Sagan", category: "Science", copies: 2 },

  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "Business", copies: 3 },
  { title: "The Lean Startup", author: "Eric Ries", category: "Business", copies: 2 },
  { title: "Zero to One", author: "Peter Thiel", category: "Business", copies: 2 },

  { title: "Guns, Germs, and Steel", author: "Jared Diamond", category: "History", copies: 2 },
  { title: "A People's History of the United States", author: "Howard Zinn", category: "History", copies: 2 }
];

(async () => {
  try {
    // 1. Categories — insert any that don't already exist
    const categoryIds = {};
    for (const name of CATEGORIES) {
      await pool.query(`INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
      const { rows: [row] } = await pool.query(`SELECT id FROM categories WHERE name = $1`, [name]);
      categoryIds[name] = row.id;
    }

    // 2. Books — skip any title that's already in the catalog
    let inserted = 0;
    for (const b of BOOKS) {
      const { rows: [existing] } = await pool.query(
        `SELECT id FROM books WHERE title = $1 AND author = $2`,
        [b.title, b.author]
      );
      if (existing) continue;

      await pool.query(
        `INSERT INTO books (title, author, category_id, total_copies, available_copies)
         VALUES ($1, $2, $3, $4, $5)`,
        [b.title, b.author, categoryIds[b.category], b.copies, b.copies]
      );
      inserted++;
    }

    console.log(`Seed complete: ${CATEGORIES.length} categories ready, ${inserted} new books added.`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await pool.end();
  }
})();
