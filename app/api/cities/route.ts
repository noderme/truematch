import db from "../../../lib/db";

export async function GET() {
  try {
    const cities = db
      .prepare("SELECT id, name FROM cities ORDER BY name")
      .all();

    return new Response(JSON.stringify({ cities }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch cities" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
