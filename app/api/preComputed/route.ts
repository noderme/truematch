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
  photos: string[]; // NEW: array of photo URLs
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

    // Fetch matches
    const result = await db.query(
      `
      SELECT 
        m.user_id,
        m.matched_user_id,
        m.totalcompatibility,
        m.charactercompatibility,
        m.desiredcompatibility,
        m.myperspective,
        m.theirperspective,
        m.ihavewhattheywant,
        m.theyhavewhatiwant,
        m.common_traits,
        u.username
      FROM matches m
      JOIN users u ON u.id = m.matched_user_id
      WHERE m.user_id = $1 AND m.totalcompatibility >= 45
      ORDER BY m.totalcompatibility DESC
      `,
      [userId],
    );

    const matches: Match[] = [];

    for (const row of result.rows) {
      // Fetch photos for this matched user
      const photoRes = await db.query(
        `SELECT url FROM photos WHERE user_id = $1 ORDER BY position ASC`,
        [row.matched_user_id],
      );
      const photos: string[] = photoRes.rows.map((p: any) => p.url);

      matches.push({
        userId: row.matched_user_id,
        username: row.username,
        totalCompatibility: row.totalcompatibility ?? 0,
        characterCompatibility: row.charactercompatibility ?? 0,
        desiredCompatibility: row.desiredcompatibility ?? 0,
        details: {
          myPerspective: row.myperspective ?? 0,
          theirPerspective: row.theirperspective ?? 0,
          iHaveWhatTheyWant: JSON.parse(row.ihavewhattheywant || "[]"),
          theyHaveWhatIWant: JSON.parse(row.theyhavewhatiwant || "[]"),
          commonTraits: JSON.parse(row.common_traits || "[]"),
        },
        photos, // add photos here
      });
    }

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
