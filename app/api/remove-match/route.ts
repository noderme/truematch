import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db"; // <-- adjust if you export differently

export async function POST(req: NextRequest) {
  try {
    const { userId, matchId } = await req.json();

    if (!userId || !matchId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    // Delete both directions:
    // (A -> B) AND (B -> A)
    await pool.query(
      `
      DELETE FROM matches
      WHERE (user_id = $1 AND matched_user_id = $2)
         OR (user_id = $2 AND matched_user_id = $1)
      `,
      [userId, matchId],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete match error:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 },
    );
  }
}
