const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function hasGeminiKey(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export async function isGeminiAvailable(): Promise<boolean> {
  if (!hasGeminiKey()) return false;
  return true;
}

export async function generateChat(prompt: string, system?: string): Promise<string | null> {
  if (!hasGeminiKey()) return null;
  try {
    const res = await fetch(`${API_BASE}/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!hasGeminiKey()) return null;
  try {
    const res = await fetch(
      `${API_BASE}/text-embedding-004:embedContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.embedding?.values || null;
  } catch {
    return null;
  }
}

export async function generateChatStream(
  prompt: string,
  system?: string,
  onToken?: (token: string) => void
): Promise<string | null> {
  if (!hasGeminiKey()) return null;
  try {
    const res = await fetch(
      `${API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        try {
          const parsed = JSON.parse(trimmed.slice(5).trim());
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            full += text;
            onToken?.(text);
          }
        } catch {}
      }
    }
    return full;
  } catch {
    return null;
  }
}
