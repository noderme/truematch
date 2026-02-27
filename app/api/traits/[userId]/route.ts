// app/api/traits/[userId]/route.ts
import db from "../../../../lib/db";
import { execOllamaPrompt, generateEmbedding } from "../../../../lib/ollama";

interface OllamaTraits {
  selfTraits: string[];
  desiredTraits: string[];
}

// JSON extraction helper
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
    .map((t) => t.toLowerCase().trim());
}

async function generateTraitsForStory(story: string): Promise<OllamaTraits> {
  const prompt = `
You are a dating profile analyzer.
Extract personality and physical traits from the user's story.
Return ONLY valid JSON:
{
  "selfTraits": ["trait1", "trait2"],
  "desiredTraits": ["trait1", "trait2"]
}
Rules:
- 10–15 traits each
- lowercase only
- single words or hyphenated phrases
- no explanations
- no extra text
Story:
"""${story}"""
`;
  const raw = await execOllamaPrompt(prompt);

  try {
    const parsed = extractJSON(raw);
    return {
      selfTraits: safeArray(parsed.selfTraits),
      desiredTraits: safeArray(parsed.desiredTraits),
    };
  } catch (err) {
    console.warn("LLM JSON parse failed:", raw);
    return { selfTraits: [], desiredTraits: [] };
  }
}

// ✅ App Router POST handler
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stmt = db.prepare("SELECT id, story FROM users WHERE id = ?");
    const user = stmt.get(userId);

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { selfTraits, desiredTraits } = await generateTraitsForStory(
      user.story,
    );

    if (!selfTraits.length || !desiredTraits.length) {
      return new Response(JSON.stringify({ error: "Empty traits generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const selfEmbedding = await generateEmbedding(selfTraits.join(" "));
    const desiredEmbedding = await generateEmbedding(desiredTraits.join(" "));

    db.prepare(
      `UPDATE users SET self_traits = ?, desired_traits = ?, self_embedding = ?, desired_embedding = ? WHERE id = ?`,
    ).run(
      JSON.stringify(selfTraits),
      JSON.stringify(desiredTraits),
      JSON.stringify(selfEmbedding),
      JSON.stringify(desiredEmbedding),
      user.id,
    );

    return new Response(
      JSON.stringify({
        message: `Traits + embeddings generated for user ${userId}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("❌ Error generating traits:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate traits" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
