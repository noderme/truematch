import { pool as db } from "../../../../lib/db";
import { generateWithClaude, generateEmbedding } from "../../../../lib/claude";

interface Traits {
  selfTraits: string[];
  desiredTraits: string[];
}

function extractJSON(raw: string): any {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1)
    throw new Error("No JSON object found in LLM output");
  return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
}

function safeArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((t) => typeof t === "string")
    .map((t) => t.toLowerCase().trim())
    .filter((t) => t.length > 0);
}

async function generateTraitsForStory(story: string): Promise<Traits> {
  const prompt = `You are a dating compatibility analyst. Extract meaningful traits from the user's dating profile story.

Return ONLY valid JSON:
{
  "selfTraits": ["trait1", "trait2", ...],
  "desiredTraits": ["trait1", "trait2", ...]
}

Rules:
- 8–12 traits each
- Focus on: personality, values, emotional style, lifestyle, relationship goals, communication
- Avoid purely physical descriptors (height, hair color) — focus on character and compatibility signals
- Use 1–3 word descriptive phrases (e.g. "emotionally intelligent", "family-oriented", "adventurous spirit")
- lowercase only
- no explanations, no extra text outside JSON

Story:
"""${story}"""`;

  const raw = await generateWithClaude(prompt);

  try {
    const parsed = extractJSON(raw);
    return {
      selfTraits: safeArray(parsed.selfTraits),
      desiredTraits: safeArray(parsed.desiredTraits),
    };
  } catch (err) {
    console.warn("Claude JSON parse failed:", raw);
    return { selfTraits: [], desiredTraits: [] };
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const result = await db.query(
      "SELECT id, story FROM users WHERE id = $1",
      [userId],
    );
    const user = result.rows[0];

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { selfTraits, desiredTraits } = await generateTraitsForStory(user.story);

    if (!selfTraits.length || !desiredTraits.length) {
      return Response.json({ error: "Empty traits generated" }, { status: 500 });
    }

    // Embed a rich sentence so Voyage captures the full semantic meaning,
    // not just a bag of keywords.
    const storyExcerpt = (user.story || "").trim().slice(0, 500);
    const selfText = `I am ${selfTraits.join(", ")}. About me: ${storyExcerpt}`;
    const desiredText = `I am looking for someone who is ${desiredTraits.join(", ")}.`;

    const selfEmbedding = await generateEmbedding(selfText);
    const desiredEmbedding = await generateEmbedding(desiredText);

    await db.query(
      `UPDATE users SET self_traits = $1, desired_traits = $2,
       self_embedding = $3, desired_embedding = $4 WHERE id = $5`,
      [
        JSON.stringify(selfTraits),
        JSON.stringify(desiredTraits),
        JSON.stringify(selfEmbedding),
        JSON.stringify(desiredEmbedding),
        user.id,
      ],
    );

    return Response.json({
      message: `Traits + embeddings generated for user ${userId}`,
    });
  } catch (err) {
    console.error("❌ Error generating traits:", err);
    return Response.json({ error: "Failed to generate traits" }, { status: 500 });
  }
}
