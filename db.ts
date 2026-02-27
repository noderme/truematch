import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "ai-match.db"));

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trait_text TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

export default db;
