import { pool as db } from "../../../lib/db";

interface MatchDetails {
  myPerspective: number;
  theirPerspective: number;
  iHaveWhatTheyWant: string[];
  theyHaveWhatIWant: string[];
  commonTraits: string[];
}

interface Match {
  userId: number;
  username: string;
  totalCompatibility: number;
  characterCompatibility: number;
  desiredCompatibility: number;
  details: MatchDetails;
}

interface MatchResponse {
  matches: Match[];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await db.query(
      `
      SELECT 
        m.user_id,
        m.matched_user_id,
        m.totalCompatibility,
        m.characterCompatibility,
        m.desiredCompatibility,
        m.myPerspective,
        m.theirPerspective,
        m.iHaveWhatTheyWant,
        m.theyHaveWhatIWant,
        m.common_traits,
        u.username
      FROM matches m
      JOIN users u ON u.id = m.matched_user_id
      WHERE m.user_id = $1
      ORDER BY m.totalCompatibility DESC
      `,
      [userId],
    );

    const rows = result.rows;

    const matches: Match[] = rows.map((row: any) => ({
      userId: row.matched_user_id,
      username: row.username,
      totalCompatibility: row.totalcompatibility,
      characterCompatibility: row.charactercompatibility,
      desiredCompatibility: row.desiredcompatibility,
      details: {
        myPerspective: row.myperspective ?? 0,
        theirPerspective: row.theirperspective ?? 0,
        iHaveWhatTheyWant: JSON.parse(row.ihavewhattheywant || "[]"),
        theyHaveWhatIWant: JSON.parse(row.theyhavewhatiwant || "[]"),
        commonTraits: JSON.parse(row.common_traits || "[]"),
      },
    }));

    return new Response(JSON.stringify({ matches }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching precomputed matches:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch matches" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
