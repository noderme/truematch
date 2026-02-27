// lib/db.ts
import { Pool } from "pg";

// Use environment variable or fallback
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:supersecret@localhost:5432/feelings";

// Type-safe global singleton to avoid multiple pools in dev/hot reload
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

// Create or reuse pool
const pool: Pool =
  global.pgPool ||
  new Pool({
    connectionString: DATABASE_URL,
    max: 20, // max 20 connections
    idleTimeoutMillis: 30000, // close idle clients after 30s
    connectionTimeoutMillis: 2000, // return error if connection takes >2s
  });

// Assign singleton for hot reload
if (!global.pgPool) global.pgPool = pool;

export { pool };
