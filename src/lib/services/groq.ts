import { isServiceAvailable, config } from "../config";
import { withRetry, withTimeout } from "../retry";
import { callGemini } from "./gemini";

/**
 * Groq — fast/cheap model used for many small aspect-labeling calls.
 * Per user spec: Groq timeout/error → retry once, then fall back to Gemini.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqJsonResult<T> {
  data: T | null;
  cost: number;
  fallbackUsed: "groq" | "gemini" | "none";
  error?: string;
}

export async function groqJson<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<GroqJsonResult<T>> {
  const model = opts.model ?? config.groqModel;
  const timeoutMs = opts.timeoutMs ?? 30_000;

  if (!isServiceAvailable("GROQ")) {
    if (isServiceAvailable("GEMINI")) {
      const gem = await callGemini<T>(systemPrompt, userPrompt, { temperature: opts.temperature });
      return { data: gem.data, cost: gem.cost, fallbackUsed: "gemini" };
    }
    return { data: null, cost: 0, fallbackUsed: "none" };
  }

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1024,
    response_format: { type: "json_object" },
  };

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(GROQ_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            const errBody = await r.text().catch(() => "");
            const e: any = new Error(`Groq ${r.status}: ${errBody.slice(0, 200)}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        timeoutMs,
        "groq",
      ),
    { maxRetries: 1, label: "groq" },
  );

  if (!res.ok) {
    const gem = await callGemini<T>(systemPrompt, userPrompt, { temperature: opts.temperature });
    return {
      data: gem.data,
      cost: gem.cost,
      fallbackUsed: "gemini",
      error: res.error.message,
    };
  }

  const data = res.value as any;
  const content = data.choices?.[0]?.message?.content ?? "{}";
  let parsed: T;
  try {
    parsed = JSON.parse(content) as T;
  } catch {
    const cleaned = content.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned) as T;
  }

  const inTok = data.usage?.prompt_tokens ?? 0;
  const outTok = data.usage?.completion_tokens ?? 0;
  const isCheap = model === config.groqCheapModel;
  const cost = isCheap
    ? (inTok / 1_000_000) * 0.05 + (outTok / 1_000_000) * 0.08
    : (inTok / 1_000_000) * 0.59 + (outTok / 1_000_000) * 0.79;

  return { data: parsed, cost, fallbackUsed: "groq" };
}
