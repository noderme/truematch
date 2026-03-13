import { pool as db } from "../../../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, story, cityId, email, password, gender } = body;

    if (!username || !story || !cityId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check unique username
    const existsRes = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existsRes.rows.length > 0) {
      return Response.json({ error: "Username exists" }, { status: 400 });
    }

    // Insert user
    const insertRes = await db.query(
      `INSERT INTO users (username, story, city_id, email, password, gender)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [username, story, cityId, email, hashedPassword, gender],
    );

    const newUserId = insertRes.rows[0].id;

    // Auto-login: issue JWT so user lands on /match without needing to log in again
    const token = jwt.sign(
      { userId: newUserId, username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return new Response(JSON.stringify({ id: newUserId, token }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
