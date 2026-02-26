// lib/ollama.ts
export async function execOllamaPrompt(prompt: string): Promise<string> {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3:latest", // Change this to your actual model (e.g., "mistral", "neural-chat")
        prompt: prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.response;
  } catch (error) {
    console.error("Error calling Ollama:", error);
    throw error;
  }
}

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
