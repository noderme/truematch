import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      "SELECT url FROM photos WHERE user_id = $1 ORDER BY position ASC",
      [id],
    );
    return NextResponse.json({ photos: rows.map((r) => r.url) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
