import { pool as db } from "../../../lib/db";

/* -------------------- HELPERS -------------------- */

function parseTraits(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((t) => t.toLowerCase().trim());
  } catch {}
  return [];
}

function parseEmbedding(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {}
  return [];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (!normA || !normB) return 0;
  return dot / (normA * normB);
}

function embeddingScore(a: number[], b: number[]): number {
  return Math.round(Math.max(0, cosineSimilarity(a, b)) * 100);
}

/**
 * Character-level bigram overlap — catches partial matches like
 * "caring" vs "care", "ambitious" vs "ambition", "adventurous" vs "adventure".
 */
function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;

  // Bigram overlap (Sørensen–Dice coefficient)
  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const bA = bigrams(a);
  const bB = bigrams(b);
  if (!bA.size || !bB.size) return 0;
  let shared = 0;
  bA.forEach((bg) => { if (bB.has(bg)) shared++; });
  const dice = (2 * shared) / (bA.size + bB.size);
  return dice > 0.45 ? Math.round(dice * 0.65 * 100) / 100 : 0;
}

function fuzzyMatchScore(listA: string[], listB: string[]): number {
  if (!listA.length || !listB.length) return 0;
  let total = 0;
  for (const a of listA) {
    let best = 0;
    for (const b of listB) best = Math.max(best, wordSimilarity(a, b));
    total += best;
  }
  return Math.round((total / listA.length) * 100);
}

function isAttracted(A: any, B: any): boolean {
  if (!A.gender || !A.sexual_orientation) return false;
  const genderA = A.gender.toLowerCase();
  const genderB = B.gender?.toLowerCase();
  const orientation = A.sexual_orientation.toLowerCase();
  if (!genderB) return false;
  if (orientation === "straight") return genderA !== genderB;
  if (orientation === "gay" || orientation === "lesbian") return genderA === genderB;
  if (orientation === "bisexual") return true;
  return false;
}

/* -------------------- MINIMUM THRESHOLD -------------------- */
const MIN_COMPATIBILITY = 45;

/* ---------------- HANDLER (App Router POST) ---------------- */

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const cityId = url.searchParams.get("cityId");

    if (!cityId) {
      return new Response(JSON.stringify({ error: "Missing cityId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { rows: users } = await db.query(
      "SELECT * FROM users WHERE city_id = $1",
      [cityId],
    );

    if (!users.length) {
      return new Response(JSON.stringify({ message: "No users in this city" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM matches WHERE user_id IN (SELECT id FROM users WHERE city_id = $1)`,
        [cityId],
      );

      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const A = users[i];
          const B = users[j];

          if (!isAttracted(A, B) || !isAttracted(B, A)) continue;

          const A_self = parseTraits(A.self_traits);
          const A_desired = parseTraits(A.desired_traits);
          const B_self = parseTraits(B.self_traits);
          const B_desired = parseTraits(B.desired_traits);

          const A_self_emb = parseEmbedding(A.self_embedding);
          const B_self_emb = parseEmbedding(B.self_embedding);
          const A_desired_emb = parseEmbedding(A.desired_embedding);
          const B_desired_emb = parseEmbedding(B.desired_embedding);

          // Fuzzy trait matching
          const characterCompatibility = fuzzyMatchScore(A_self, B_self);
          const desiredCompatibility = fuzzyMatchScore(A_desired, B_desired);
          const myPerspective = fuzzyMatchScore(A_self, B_desired);    // does A have what B wants?
          const theirPerspective = fuzzyMatchScore(B_self, A_desired); // does B have what A wants?

          // Semantic embedding compatibility — now symmetric:
          //   sim(A_self, B_self)      → are they similar people?
          //   sim(A_self, B_desired)   → does A match B's ideal?
          //   sim(B_self, A_desired)   → does B match A's ideal?  ← was missing before
          const embeddingCompatibility = Math.round(
            (embeddingScore(A_self_emb, B_self_emb) +
              embeddingScore(A_self_emb, B_desired_emb) +
              embeddingScore(B_self_emb, A_desired_emb)) /
              3,
          );

          // Rebalanced weights:
          //   Semantic embeddings carry most of the signal (40%)
          //   Mutual fit (do we have what each other wants) is next (20+20)
          //   Raw trait overlap matters less (10+10)
          const totalCompatibility = Math.round(
            myPerspective * 0.2 +
              theirPerspective * 0.2 +
              embeddingCompatibility * 0.4 +
              characterCompatibility * 0.1 +
              desiredCompatibility * 0.1,
          );

          // Skip weak matches — don't pollute users' feeds
          if (totalCompatibility < MIN_COMPATIBILITY) continue;

          const commonTraits = A_self.filter((t) =>
            B_self.some((b: string) => wordSimilarity(t, b) > 0.7),
          );

          const insertQuery = `
            INSERT INTO matches
            (user_id, matched_user_id, totalCompatibility,
             characterCompatibility, desiredCompatibility,
             embeddingCompatibility,
             myPerspective, theirPerspective,
             iHaveWhatTheyWant, theyHaveWhatIWant, common_traits)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (user_id, matched_user_id) DO UPDATE SET
              totalCompatibility = EXCLUDED.totalCompatibility,
              characterCompatibility = EXCLUDED.characterCompatibility,
              desiredCompatibility = EXCLUDED.desiredCompatibility,
              embeddingCompatibility = EXCLUDED.embeddingCompatibility,
              myPerspective = EXCLUDED.myPerspective,
              theirPerspective = EXCLUDED.theirPerspective,
              iHaveWhatTheyWant = EXCLUDED.iHaveWhatTheyWant,
              theyHaveWhatIWant = EXCLUDED.theyHaveWhatIWant,
              common_traits = EXCLUDED.common_traits
          `;

          // A → B
          await client.query(insertQuery, [
            A.id, B.id,
            totalCompatibility, characterCompatibility, desiredCompatibility,
            embeddingCompatibility, myPerspective, theirPerspective,
            JSON.stringify(B_desired.filter((t: string) => A_self.some((a: string) => wordSimilarity(a, t) > 0.7))),
            JSON.stringify(A_desired.filter((t: string) => B_self.some((b: string) => wordSimilarity(b, t) > 0.7))),
            JSON.stringify(commonTraits),
          ]);

          // B → A (perspectives are swapped)
          await client.query(insertQuery, [
            B.id, A.id,
            totalCompatibility, characterCompatibility, desiredCompatibility,
            embeddingCompatibility, theirPerspective, myPerspective,
            JSON.stringify(A_desired.filter((t: string) => B_self.some((b: string) => wordSimilarity(b, t) > 0.7))),
            JSON.stringify(B_desired.filter((t: string) => A_self.some((a: string) => wordSimilarity(a, t) > 0.7))),
            JSON.stringify(commonTraits),
          ]);
        }
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return new Response(JSON.stringify({ message: "Match engine completed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Match engine error:", err);
    return new Response(JSON.stringify({ error: "Failed to calculate matches" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
