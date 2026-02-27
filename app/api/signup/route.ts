import db from "../../../lib/db";
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
    const exists = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);
    if (exists) {
      return new Response(JSON.stringify({ error: "Username exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Insert user
    const stmt = db.prepare(
      "INSERT INTO users (username, story, city_id, email, password, gender) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const result = stmt.run(
      username,
      story,
      cityId,
      email,
      hashedPassword,
      gender,
    );

    // Respond after user is created
    return new Response(JSON.stringify({ id: result.lastInsertRowid }), {
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
