// lib/db.ts
// @ts-ignore
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "app.db");
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

declare global {
  // Prevent multiple instances in dev mode
  // eslint-disable-next-line no-var
  var sqlite: Database | undefined;
}

const db =
  global.sqlite ||
  new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
  });

if (!global.sqlite) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 10000"); // wait up to 5 seconds if locked

  /* ================= USERS TABLE ================= */

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      story TEXT NOT NULL,
      city_id INTEGER NOT NULL,

      gender TEXT,                               -- male / female
      sexual_orientation TEXT DEFAULT 'straight', -- straight / gay / lesbian / bisexual

      self_traits TEXT,
      desired_traits TEXT,

      email TEXT,
      password TEXT
    )
  `,
  ).run();

  /* ================= MATCHES TABLE ================= */

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      user_id INTEGER NOT NULL,
      matched_user_id INTEGER NOT NULL,

      totalCompatibility INTEGER NOT NULL DEFAULT 0,
      characterCompatibility INTEGER NOT NULL DEFAULT 0,
      desiredCompatibility INTEGER NOT NULL DEFAULT 0,

      myPerspective INTEGER NOT NULL DEFAULT 0,
      theirPerspective INTEGER NOT NULL DEFAULT 0,

      iHaveWhatTheyWant TEXT,
      theyHaveWhatIWant TEXT,   -- ✅ FIXED COLUMN NAME
      common_traits TEXT,

      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(matched_user_id) REFERENCES users(id),

      UNIQUE(user_id, matched_user_id)
    )
  `,
  ).run();

  /* ================= CITIES TABLE ================= */

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `,
  ).run();

  const count = db.prepare("SELECT COUNT(*) as c FROM cities").get().c;

  if (count === 0) {
    const cities = [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Kolkata",
      "Chennai",
      "Hyderabad",
    ];

    const insert = db.prepare("INSERT INTO cities (name) VALUES (?)");

    for (const city of cities) {
      insert.run(city);
    }
  }

  global.sqlite = db;
}

export default db;
