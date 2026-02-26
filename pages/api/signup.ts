// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";
import bcrypt from "bcrypt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, story, cityId, email, password, gender } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  if (!username || !story || !cityId)
    return res.status(400).json({ error: "Missing fields" });

  // check unique username
  const exists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (exists) return res.status(400).json({ error: "Username exists" });

  // insert user first
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
  const userId = result.lastInsertRowid;

  // respond after user is created
  res.status(200).json({ userId });
}
