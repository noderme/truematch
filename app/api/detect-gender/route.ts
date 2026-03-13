import { generateWithClaudeVision } from "@/lib/claude";

function normalizeGender(raw: string): "male" | "female" | "unknown" {
  const cleaned = raw.toLowerCase().trim();
  if (cleaned.includes("female")) return "female";
  if (cleaned.includes("male")) return "male";
  return "unknown";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.photos || !Array.isArray(body.photos) || body.photos.length === 0) {
      return Response.json({ error: "No photos uploaded" }, { status: 400 });
    }

    const genderVotes: ("male" | "female" | "unknown")[] = [];

    for (const base64 of body.photos) {
      try {
        const raw = await generateWithClaudeVision(
          "Look at this photo and reply with ONLY one word: Male, Female, or Unknown.",
          [base64],
        );
        genderVotes.push(normalizeGender(raw));
      } catch (err) {
        console.error("Error detecting gender for photo:", err);
        genderVotes.push("unknown");
      }
    }

    // Majority vote
    const maleCount = genderVotes.filter((g) => g === "male").length;
    const femaleCount = genderVotes.filter((g) => g === "female").length;

    let finalGender: "male" | "female" | "unknown" = "unknown";
    if (maleCount > femaleCount) finalGender = "male";
    else if (femaleCount > maleCount) finalGender = "female";

    return Response.json({ gender: finalGender, rawVotes: genderVotes });
  } catch (err) {
    console.error("Detect gender API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
