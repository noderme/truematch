import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { city, story } = body;

    if (!city || !story) {
      return NextResponse.json(
        { error: "City and story are required" },
        { status: 400 },
      );
    }

    const query =
      "UPDATE users SET city=$1, story=$2 WHERE id=$3 RETURNING id, username, city, story";
    const values = [city, story, id];

    const { rows } = await pool.query(query, values);

    if (!rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (err: any) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
