/**
 * Centralized environment + service configuration.
 *
 * The agent supports "demo mode": when paid API keys are missing, services
 * return realistic mock data so the full agent pipeline still executes
 * end-to-end. The UI surfaces a "DEMO MODE" banner so the user is never
 * misled about which data is real vs synthetic.
 *
 * Free-tier keys expected in .env:
 *   GROQ_API_KEY
 *   GEMINI_API_KEY
 *   APIFY_API_TOKEN
 *   SERPER_API_KEY
 *   TAVILY_API_KEY
 *   FIRECRAWL_API_KEY_1   (account 1)
 *   FIRECRAWL_API_KEY_2   (account 2)
 *   HF_API_TOKEN           (HuggingFace Inference API for embeddings)
 *   JWT_SECRET             (random 32+ char string)
 */

export type ServiceKey =
  | "GROQ"
  | "GEMINI"
  | "APIFY"
  | "SERPER"
  | "TAVILY"
  | "FIRECRAWL_1"
  | "FIRECRAWL_2"
  | "HF";

const KEY_ENV_MAP: Record<ServiceKey, string | undefined> = {
  GROQ: process.env.GROQ_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY,
  APIFY: process.env.APIFY_API_TOKEN,
  SERPER: process.env.SERPER_API_KEY,
  TAVILY: process.env.TAVILY_API_KEY,
  FIRECRAWL_1: process.env.FIRECRAWL_API_KEY_1,
  FIRECRAWL_2: process.env.FIRECRAWL_API_KEY_2,
  HF: process.env.HF_API_TOKEN,
};

export const config = {
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me-in-production-min-32-chars",
  cacheTtlMs: 48 * 60 * 60 * 1000, // 48 hours
  maxReviewsPerProduct: 400,
  reviewBatchSize: 12, // 10-15 per LLM call per user spec
  maxRetries: 2, // for rate-limited / failing API calls
  backoffBaseMs: 1200,
  groqModel: "llama-3.3-70b-versatile",
  groqCheapModel: "llama-3.1-8b-instant",
  geminiModel: "gemini-2.0-flash",
  hfEmbeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
  firecrawl1Key: process.env.FIRECRAWL_API_KEY_1,
  firecrawl2Key: process.env.FIRECRAWL_API_KEY_2,
} as const;

export function isServiceAvailable(key: ServiceKey): boolean {
  return !!KEY_ENV_MAP[key] && KEY_ENV_MAP[key]!.length > 0;
}

export function serviceAvailability(): Record<ServiceKey, boolean> {
  return (Object.keys(KEY_ENV_MAP) as ServiceKey[]).reduce(
    (acc, k) => {
      acc[k] = isServiceAvailable(k);
      return acc;
    },
    {} as Record<ServiceKey, boolean>,
  );
}

export function isDemoMode(): boolean {
  // Demo mode = at least one paid service missing keys AND no Apify key
  return !isServiceAvailable("APIFY");
}
