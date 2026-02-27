// lib/ollama.ts
import { spawn } from "child_process";

/**
 * Executes an Ollama prompt using your local model.
 * Returns the raw string output from the model.
 */
export function execOllamaPrompt(
  prompt: string,
  model = "llama3:latest",
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";

    // Spawn Ollama without passing the prompt as a command-line arg
    const child = spawn("ollama", ["run", model], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Collect stdout
    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Collect stderr
    child.stderr.on("data", (data) => {
      console.error("Ollama stderr:", data.toString());
    });

    // Handle process exit
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Ollama exited with code ${code}`));
      }
      resolve(output.trim());
    });

    child.on("error", (err) => reject(err));

    // Send prompt via stdin to avoid E2BIG
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Generates embedding using Ollama embeddings API.
 */
export async function generateEmbedding(text: string) {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: text,
    }),
  });

  const data = await response.json();
  return data.embedding;
}
