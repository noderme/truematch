import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { userId, photos } = body as {
      userId: number;
      photos: string[];
    };

    // 🔎 Validation
    if (!userId || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: "Invalid userId or photos array" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // Optional: delete old photos if re-uploading
    await client.query("DELETE FROM photos WHERE user_id = $1", [userId]);

    // Insert photos with ordering
    for (let i = 0; i < photos.length; i++) {
      await client.query(
        `
        INSERT INTO photos (user_id, url, position)
        VALUES ($1, $2, $3)
        `,
        [userId, photos[i], i],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Save photos error:", error);

    return NextResponse.json(
      { error: "Failed to save photos" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
