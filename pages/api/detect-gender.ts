import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { execOllamaPrompt } from "../../lib/ollama";

export const config = {
  api: { bodyParser: false },
};

const parseForm = (req: NextApiRequest) =>
  new Promise<{ files: formidable.Files }>((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve({ files });
    });
  });

function normalizeGender(raw: string): "male" | "female" | "unknown" {
  const cleaned = raw.toLowerCase().trim();

  if (cleaned.includes("male")) return "male";
  if (cleaned.includes("female")) return "female";
  return "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);

    if (!files.photos) {
      return res.status(400).json({ error: "No photos uploaded" });
    }

    const uploadedFiles = Array.isArray(files.photos)
      ? files.photos
      : [files.photos];

    const genderVotes: ("male" | "female" | "unknown")[] = [];

    for (const file of uploadedFiles) {
      try {
        const imageData = fs.readFileSync(file.filepath, {
          encoding: "base64",
        });

        const prompt = `
You are a gender classifier.

Reply ONLY with one word:
Male
Female
Unknown

Image base64:
${imageData}
`;

        const raw = await execOllamaPrompt(prompt);
        const gender = normalizeGender(raw);

        genderVotes.push(gender);
      } catch (err) {
        console.error("Error detecting gender:", err);
        genderVotes.push("unknown");
      }
    }

    // Majority vote logic
    const maleCount = genderVotes.filter((g) => g === "male").length;
    const femaleCount = genderVotes.filter((g) => g === "female").length;

    let finalGender: "male" | "female" | "unknown" = "unknown";

    if (maleCount > femaleCount) finalGender = "male";
    else if (femaleCount > maleCount) finalGender = "female";

    return res.status(200).json({
      gender: finalGender,
      rawVotes: genderVotes,
    });
  } catch (err) {
    console.error("Detect gender API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
