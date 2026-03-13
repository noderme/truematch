import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool as db } from "../../../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const result = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username],
    );
    const user = result.rows[0];

    if (!user) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return new Response(JSON.stringify({ token, userId: user.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
