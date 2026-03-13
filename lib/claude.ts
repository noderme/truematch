import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate text using Claude Haiku (fast + cheap for structured tasks).
 */
export async function generateWithClaude(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return (message.content[0] as Anthropic.TextBlock).text;
}

/**
 * Generate text using Claude with vision (base64 images).
 */
export async function generateWithClaudeVision(
  prompt: string,
  base64Images: string[],
): Promise<string> {
  const imageBlocks: Anthropic.ImageBlockParam[] = base64Images.map((img) => ({
    type: "image",
    source: {
      type: "base64",
      media_type: "image/jpeg",
      data: img,
    },
  }));

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  return (message.content[0] as Anthropic.TextBlock).text;
}

/**
 * Generate text embeddings via Voyage AI.
 * Requires VOYAGE_API_KEY in environment variables.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: [text],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}
