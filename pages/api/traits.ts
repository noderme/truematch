// pages/api/traits.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";
import { execOllamaPrompt, generateEmbedding } from "../../lib/ollama";

interface OllamaTraits {
  selfTraits: string[];
  desiredTraits: string[];
}

/**
 * Extract JSON object from messy LLM response
 */
function extractJSON(raw: string): any {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in LLM output");
  }

  const jsonString = raw.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

function safeArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((t) => typeof t === "string")
    .map((t) => t.toLowerCase().trim());
}

/**
 * Generate traits from story using LLM
 */
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const users = db
      .prepare(`SELECT id, story FROM users WHERE story IS NOT NULL`)
      .all();

    let processed = 0;

    for (const user of users) {
      if (!user.story) continue;

      console.log(`Generating traits for user ${user.id}`);

      const { selfTraits, desiredTraits } = await generateTraitsForStory(
        user.story,
      );

      // Skip if LLM failed
      if (!selfTraits.length || !desiredTraits.length) {
        console.warn(`Skipping user ${user.id} (empty traits)`);
        continue;
      }

      // Generate embeddings
      const selfEmbedding = await generateEmbedding(selfTraits.join(" "));
      const desiredEmbedding = await generateEmbedding(desiredTraits.join(" "));

      // Update DB (single statement per user to avoid lock issues)
      db.prepare(
        `
        UPDATE users
        SET self_traits = ?,
            desired_traits = ?,
            self_embedding = ?,
            desired_embedding = ?
        WHERE id = ?
      `,
      ).run(
        JSON.stringify(selfTraits),
        JSON.stringify(desiredTraits),
        JSON.stringify(selfEmbedding),
        JSON.stringify(desiredEmbedding),
        user.id,
      );

      processed++;
    }

    res.status(200).json({
      message: `Traits + embeddings generated for ${processed} users`,
    });
  } catch (err) {
    console.error("❌ Error generating traits:", err);
    res.status(500).json({ error: "Failed to generate traits" });
  }
}
