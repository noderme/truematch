import { pool as db } from "../../../lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, story, cityId, email, password, gender } = body;

    if (!username || !story || !cityId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check unique username
    const existsRes = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existsRes.rows.length > 0) {
      return new Response(JSON.stringify({ error: "Username exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert user
    const insertRes = await db.query(
      `
      INSERT INTO users (username, story, city_id, email, password, gender)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [username, story, cityId, email, hashedPassword, gender],
    );

    const newUserId = insertRes.rows[0].id;

    return new Response(JSON.stringify({ id: newUserId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
