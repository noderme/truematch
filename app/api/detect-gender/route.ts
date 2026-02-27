import { execOllamaPrompt } from "@/lib/ollama";

// -------------------- GENDER NORMALIZER --------------------
function normalizeGender(raw: string): "male" | "female" | "unknown" {
  const cleaned = raw.toLowerCase().trim();
  if (cleaned.includes("male")) return "male";
  if (cleaned.includes("female")) return "female";
  return "unknown";
}

// -------------------- HANDLER --------------------
export async function POST(req: Request) {
  try {
    // Parse JSON body (no bodyParser config needed)
    const body = await req.json();

    // Expect `body.photos` as base64 strings
    if (
      !body.photos ||
      !Array.isArray(body.photos) ||
      body.photos.length === 0
    ) {
      return new Response(JSON.stringify({ error: "No photos uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const genderVotes: ("male" | "female" | "unknown")[] = [];

    for (const base64 of body.photos) {
      try {
        const prompt = `
You are a gender classifier.

Reply ONLY with one word:
Male
Female
Unknown

Image base64:
${base64}
`;

        const raw = await execOllamaPrompt(prompt);
        const gender = normalizeGender(raw);
        genderVotes.push(gender);
      } catch (err) {
        console.error("Error detecting gender:", err);
        genderVotes.push("unknown");
      }
    }

    // Majority vote
    const maleCount = genderVotes.filter((g) => g === "male").length;
    const femaleCount = genderVotes.filter((g) => g === "female").length;

    let finalGender: "male" | "female" | "unknown" = "unknown";
    if (maleCount > femaleCount) finalGender = "male";
    else if (femaleCount > maleCount) finalGender = "female";

    return new Response(
      JSON.stringify({ gender: finalGender, rawVotes: genderVotes }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Detect gender API error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
