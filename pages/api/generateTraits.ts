import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { userStory } = req.body;
  if (!userStory)
    return res.status(400).json({ error: "userStory is required" });

  try {
    const prompt = `
You are an expert in human relationships.
Analyze this person's story and experiences, and generate 8-10 short traits
that describe what this person is looking for in a partner.
Focus on expectations, values, emotional needs, and desired qualities.
Output as a JSON array of short phrases suitable for clickable buttons.

User story: """${userStory}"""
`;

    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest", // your local model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    let traits: string[] = [];
    try {
      traits = JSON.parse(data.choices[0].message.content);
    } catch {
      traits = data.choices[0].message.content
        .split("\n")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    console.log("TRAITS", traits);
    res.status(200).json({ traits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate traits" });
  }
}
