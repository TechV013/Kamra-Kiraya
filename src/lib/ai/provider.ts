import * as ollama from "./ollama";
import * as gemini from "./gemini";

export type AIProvider = "ollama" | "gemini" | "none";

let cachedProvider: AIProvider | null = null;
let lastCheck = 0;

export async function getActiveProvider(): Promise<AIProvider> {
  const now = Date.now();
  if (cachedProvider && now - lastCheck < 10_000) return cachedProvider;

  const oa = await ollama.isOllamaAvailable();
  if (oa) {
    cachedProvider = "ollama";
    lastCheck = now;
    return "ollama";
  }

  const gm = await gemini.isGeminiAvailable();
  if (gm) {
    cachedProvider = "gemini";
    lastCheck = now;
    return "gemini";
  }

  cachedProvider = "none";
  lastCheck = now;
  return "none";
}

export function clearProviderCache() {
  cachedProvider = null;
  lastCheck = 0;
}

export async function generateChat(prompt: string, system?: string): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === "ollama") return ollama.generateChat(prompt, system);
  if (provider === "gemini") return gemini.generateChat(prompt, system);
  return null;
}

export async function generateChatStream(
  prompt: string,
  system?: string,
  onToken?: (token: string) => void
): Promise<string | null> {
  const provider = await getActiveProvider();
  if (provider === "ollama") return ollama.generateChatStream(prompt, system, onToken);
  if (provider === "gemini") return gemini.generateChatStream(prompt, system, onToken);
  return null;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const provider = await getActiveProvider();
  if (provider === "ollama") return ollama.generateEmbedding(text);
  if (provider === "gemini") return gemini.generateEmbedding(text);
  return null;
}

export function getProviderLabel(): string {
  if (cachedProvider === "ollama") return "Ollama (local)";
  if (cachedProvider === "gemini") return "Google Gemini";
  return "AI Offline";
}
