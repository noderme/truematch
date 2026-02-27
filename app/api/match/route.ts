import db from "../../../lib/db";

/* -------------------- HELPERS -------------------- */

function parseTraits(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((t) => t.toLowerCase().trim());
    }
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

/* ---------------- COSINE SIMILARITY ---------------- */

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

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
  const score = cosineSimilarity(a, b);
  return Math.round(Math.max(0, score) * 100);
}

/* ---------------- FUZZY TRAIT MATCH ---------------- */

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  return 0;
}

function fuzzyMatchScore(listA: string[], listB: string[]): number {
  if (!listA.length || !listB.length) return 0;

  let total = 0;

  for (const a of listA) {
    let best = 0;
    for (const b of listB) {
      best = Math.max(best, wordSimilarity(a, b));
    }
    total += best;
  }

  return Math.round((total / listA.length) * 100);
}

/* ---------------- ATTRACTION ---------------- */

function isAttracted(A: any, B: any): boolean {
  if (!A.gender || !A.sexual_orientation) return false;

  const genderA = A.gender.toLowerCase();
  const genderB = B.gender?.toLowerCase();
  const orientation = A.sexual_orientation.toLowerCase();

  if (!genderB) return false;

  if (orientation === "straight") return genderA !== genderB;
  if (orientation === "gay" || orientation === "lesbian")
    return genderA === genderB;
  if (orientation === "bisexual") return true;

  return false;
}

/* ---------------- HANDLER (App Router POST) ---------------- */

export async function POST(
  req: Request,
  { params }: { params: { cityId?: string } },
) {
  const { cityId } = params;

  if (!cityId) {
    return new Response(JSON.stringify({ error: "Missing cityId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const users = db
      .prepare("SELECT * FROM users WHERE city_id = ?")
      .all(cityId);

    if (!users.length) {
      return new Response(
        JSON.stringify({ message: "No users in this city" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO matches
      (user_id, matched_user_id, totalCompatibility,
       characterCompatibility, desiredCompatibility,
       embeddingCompatibility,
       myPerspective, theirPerspective,
       iHaveWhatTheyWant, theyHaveWhatIWant, common_traits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const clearStmt = db.prepare(`
      DELETE FROM matches
      WHERE user_id IN (
        SELECT id FROM users WHERE city_id = ?
      )
    `);

    const transaction = db.transaction(() => {
      clearStmt.run(cityId);

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

          /* -------- TRAIT BASED -------- */
          const characterCompatibility = fuzzyMatchScore(A_self, B_self);
          const desiredCompatibility = fuzzyMatchScore(A_desired, B_desired);
          const myPerspective = fuzzyMatchScore(A_self, B_desired);
          const theirPerspective = fuzzyMatchScore(B_self, A_desired);

          /* -------- EMBEDDING BASED -------- */
          const embeddingCharacter = embeddingScore(A_self_emb, B_self_emb);
          const embeddingDesire = embeddingScore(A_self_emb, B_desired_emb);
          const embeddingCompatibility = Math.round(
            (embeddingCharacter + embeddingDesire) / 2,
          );

          /* -------- FINAL SCORE -------- */
          const totalCompatibility = Math.round(
            characterCompatibility * 0.25 +
              desiredCompatibility * 0.15 +
              myPerspective * 0.15 +
              theirPerspective * 0.15 +
              embeddingCompatibility * 0.3,
          );

          const commonTraits = A_self.filter((t) =>
            B_self.some((b: string) => wordSimilarity(t, b) > 0.7),
          );

          insertStmt.run(
            A.id,
            B.id,
            totalCompatibility,
            characterCompatibility,
            desiredCompatibility,
            embeddingCompatibility,
            myPerspective,
            theirPerspective,
            JSON.stringify(
              B_desired.filter((t: string) =>
                A_self.some((a: string) => wordSimilarity(a, t) > 0.7),
              ),
            ),
            JSON.stringify(
              A_desired.filter((t: string) =>
                B_self.some((b: string) => wordSimilarity(b, t) > 0.7),
              ),
            ),
            JSON.stringify(commonTraits),
          );

          insertStmt.run(
            B.id,
            A.id,
            totalCompatibility,
            characterCompatibility,
            desiredCompatibility,
            embeddingCompatibility,
            theirPerspective,
            myPerspective,
            JSON.stringify(
              A_desired.filter((t: string) =>
                B_self.some((b: string) => wordSimilarity(b, t) > 0.7),
              ),
            ),
            JSON.stringify(
              B_desired.filter((t: string) =>
                A_self.some((a: string) => wordSimilarity(a, t) > 0.7),
              ),
            ),
            JSON.stringify(commonTraits),
          );
        }
      }
    });

    transaction();

    return new Response(
      JSON.stringify({
        message: "Match engine completed (embeddings enabled)",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Match engine error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to calculate matches" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
