import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      "SELECT id, username, city_id, story FROM users WHERE id = $1",
      [id],
    );
    if (!rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { cityId, story } = body;

    if (!cityId || !story) {
      return NextResponse.json(
        { error: "City and story are required" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      "UPDATE users SET city_id=$1, story=$2 WHERE id=$3 RETURNING id, username, city_id, story",
      [cityId, story, id],
    );

    if (!rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Re-trigger traits generation in the background after story update
    fetch(`${req.nextUrl.origin}/api/traits/${id}`, { method: "POST" }).catch(
      (err) => console.error("Failed to re-queue traits:", err),
    );

    return NextResponse.json({ user: rows[0] });
  } catch (err: any) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
