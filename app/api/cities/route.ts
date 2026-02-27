// app/api/cities/route.ts
import { pool } from "../../../lib/db";

export async function GET() {
  try {
    const res = await pool.query("SELECT * FROM cities");
    console.log(res.rows);
    return new Response(JSON.stringify(res.rows), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
