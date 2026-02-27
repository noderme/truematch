import db from "../../../lib/db";

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

    const rows = db
      .prepare(
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
        WHERE m.user_id = ?
        ORDER BY m.totalCompatibility DESC
      `,
      )
      .all(userId);

    const matches: Match[] = rows.map((row: any) => ({
      userId: row.matched_user_id,
      username: row.username,
      totalCompatibility: row.totalCompatibility,
      characterCompatibility: row.characterCompatibility,
      desiredCompatibility: row.desiredCompatibility,
      details: {
        myPerspective: row.myPerspective ?? 0,
        theirPerspective: row.theirPerspective ?? 0,
        iHaveWhatTheyWant: JSON.parse(row.iHaveWhatTheyWant || "[]"),
        theyHaveWhatIWant: JSON.parse(row.theyHaveWhatIWant || "[]"),
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
