export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userStory } = body;

    if (!userStory) {
      return new Response(JSON.stringify({ error: "userStory is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    return new Response(JSON.stringify({ traits }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to generate traits" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
