import { isServiceAvailable, config } from "../config";
import { withRetry, withTimeout } from "../retry";

/**
 * Gemini — stronger model used ONLY for the single final Insight Synthesis call.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiJsonResult<T> {
  data: T | null;
  cost: number;
  error?: string;
}

export async function callGemini<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<GeminiJsonResult<T>> {
  if (!isServiceAvailable("GEMINI")) {
    return { data: null, cost: 0 };
  }

  const model = config.geminiModel;
  const url = `${GEMINI_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxTokens ?? 2048,
      responseMimeType: "application/json",
    },
  };

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            const errBody = await r.text().catch(() => "");
            const e: any = new Error(`Gemini ${r.status}: ${errBody.slice(0, 200)}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        opts.timeoutMs ?? 60_000,
        "gemini",
      ),
    { label: "gemini" },
  );

  if (!res.ok) return { data: null, cost: 0, error: res.error.message };

  const data = res.value as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  let parsed: T;
  try {
    parsed = JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned) as T;
  }

  const inTok = data.usageMetadata?.promptTokenCount ?? 0;
  const outTok = data.usageMetadata?.candidatesTokenCount ?? 0;
  const cost = (inTok / 1_000_000) * 0.1 + (outTok / 1_000_000) * 0.4;

  return { data: parsed, cost };
}
