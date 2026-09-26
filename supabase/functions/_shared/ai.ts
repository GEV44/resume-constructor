// Provider-agnostic structured-output client for any OpenAI-compatible
// chat-completions endpoint (Lovable AI Gateway by default, or OpenRouter,
// Google AI Studio's OpenAI endpoint, OpenAI, a self-hosted gateway…).
import { HttpError } from "./http.ts";

const BASE_URL = (Deno.env.get("AI_BASE_URL") ?? "https://ai.gateway.lovable.dev/v1").replace(/\/$/, "");
const API_KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
const DEFAULT_MODEL = Deno.env.get("AI_MODEL") ?? "google/gemini-3-flash-preview";
const TIMEOUT_MS = Number(Deno.env.get("AI_TIMEOUT_MS") ?? 90_000);

type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export interface ToolCallRequest {
  system: string;
  user: string | ContentPart[];
  tool: { name: string; description: string; parameters: Record<string, unknown> };
  model?: string;
  temperature?: number;
}

/** Today's date for prompts, so the model never assumes a stale "current year". */
export function todayLine(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Today is ${today}. Apply current resume and hiring-market conventions.`;
}

async function post(body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new HttpError(504, "The AI service timed out. Please try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Forces a single function call and returns its parsed arguments. Retries once on 5xx. */
export async function callTool<T>(req: ToolCallRequest): Promise<T> {
  if (!API_KEY) throw new Error("AI_API_KEY (or LOVABLE_API_KEY) is not configured");
  const body = {
    model: req.model ?? DEFAULT_MODEL,
    temperature: req.temperature ?? 0.2,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
    tools: [{ type: "function", function: req.tool }],
    tool_choice: { type: "function", function: { name: req.tool.name } },
  };

  let res = await post(body);
  if (res.status >= 500) res = await post(body);

  if (!res.ok) {
    const detail = await res.text();
    console.error("AI gateway error:", res.status, detail.slice(0, 500));
    if (res.status === 429) throw new HttpError(429, "The AI service is busy. Please try again in a moment.");
    if (res.status === 402) throw new HttpError(402, "AI credits are exhausted. Please contact the site owner.");
    throw new HttpError(502, "The AI service failed to respond. Please try again.");
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message;
  const args: string | undefined = message?.tool_calls?.[0]?.function?.arguments ?? message?.content?.match(/\{[\s\S]*\}/)?.[0];
  if (!args) throw new HttpError(502, "The AI returned an empty response. Please try again.");
  try {
    return JSON.parse(args) as T;
  } catch {
    throw new HttpError(502, "The AI returned malformed data. Please try again.");
  }
}
