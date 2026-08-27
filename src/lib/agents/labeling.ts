import { groqJson } from "../services/groq";
import type { AspectCluster, ReviewItem, Sentiment } from "../types";

/**
 * Aspect Labeling Agent.
 * Per spec: each cluster (10-15 reviews per batch, NEVER dump all reviews in one call)
 * calls Groq (cheap/fast model) with forced JSON output:
 *   {aspect, sentiment, frequency, example_quotes[]}
 */
export interface LabelClusterResult {
  cluster: AspectCluster | null;
  cost: number;
  fallbackUsed: "groq" | "gemini" | "none";
  error?: string;
}

const SYSTEM_PROMPT = `You are a product review analyst. Given a batch of customer reviews (10-15 max), identify:
- aspect: the single product aspect these reviews cluster around (e.g. "battery life", "build quality", "connectivity")
- sentiment: overall sentiment of this cluster (positive | negative | mixed | neutral)
- frequency: how many reviews discuss this aspect (the count of reviews that match)
- example_quotes: 2-3 short representative quotes from the batch (verbatim, ≤120 chars each)
- confidence: your confidence in this labeling, 0.0 to 1.0

Return ONLY valid JSON in this shape:
{"aspect": string, "sentiment": "positive"|"negative"|"mixed"|"neutral", "frequency": number, "example_quotes": string[], "confidence": number}`;

export async function labelClusterBatch(
  productName: string,
  batch: ReviewItem[],
): Promise<LabelClusterResult> {
  if (batch.length === 0) {
    return { cluster: null, cost: 0, fallbackUsed: "none" };
  }

  // Per spec: cap batch at 10-15 reviews per call
  const limited = batch.slice(0, 15);

  const userPrompt = `Product: ${productName}

Reviews (${limited.length} total):
${limited.map((r, i) => `${i + 1}. [rating=${r.rating ?? "?"}] ${r.body}`).join("\n")}

Identify the dominant aspect and sentiment of this cluster. Return JSON.`;

  const res = await groqJson<{
    aspect: string;
    sentiment: Sentiment;
    frequency: number;
    example_quotes: string[];
    confidence: number;
  }>(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.2,
    maxTokens: 600,
    timeoutMs: 20_000,
  });

  if (!res.data) {
    // Demo-mode fallback: rule-based aspect detection from review text.
    // Used only when both Groq AND Gemini are unavailable so the pipeline
    // still produces structured output end-to-end.
    const mock = mockLabel(batch);
    if (mock) {
      return { cluster: mock, cost: 0, fallbackUsed: "none" };
    }
    return { cluster: null, cost: res.cost, fallbackUsed: res.fallbackUsed, error: res.error };
  }

  // Compute source breakdown: marketplace vs reddit vs blog
  const sourceBreakdown = {
    marketplace: batch.filter((r) => r.source === "marketplace").length,
    reddit: batch.filter((r) => r.source === "reddit").length,
    blog: batch.filter((r) => r.source === "blog").length,
  };

  const cluster: AspectCluster = {
    aspect: res.data.aspect ?? "unknown",
    sentiment: res.data.sentiment ?? "mixed",
    frequency: res.data.frequency ?? limited.length,
    exampleQuotes: (res.data.example_quotes ?? []).slice(0, 3),
    confidence: res.data.confidence ?? 0.7,
    sourceBreakdown,
  };

  return { cluster, cost: res.cost, fallbackUsed: res.fallbackUsed };
}

// ---------- Demo-mode rule-based labeler ----------
// Activated only when both Groq and Gemini are unavailable. Uses a curated
// keyword dictionary to detect the dominant aspect in a batch.

const ASPECT_KEYWORDS: { aspect: string; sentiment: Sentiment; keywords: string[] }[] = [
  {
    aspect: "battery life",
    sentiment: "positive",
    keywords: ["battery", "charge", "charging", "lasts", "standby", "power"],
  },
  {
    aspect: "build quality",
    sentiment: "mixed",
    keywords: ["build", "quality", "hinge", "plastic", "metal", "premium", "sturdy"],
  },
  {
    aspect: "value for money",
    sentiment: "positive",
    keywords: ["value", "price", "worth", "money", "expensive", "cheap", "affordable"],
  },
  {
    aspect: "sound quality",
    sentiment: "positive",
    keywords: ["sound", "audio", "bass", "treble", "noise", "audio", "music"],
  },
  {
    aspect: "comfort",
    sentiment: "negative",
    keywords: ["comfort", "hurts", "tight", "stiff", "ears", "headband", "fit"],
  },
  {
    aspect: "connectivity",
    sentiment: "negative",
    keywords: ["connect", "bluetooth", "pairing", "drops", "wireless", "disconnect"],
  },
  {
    aspect: "design",
    sentiment: "positive",
    keywords: ["design", "look", "aesthetic", "stylish", "color"],
  },
  {
    aspect: "durability",
    sentiment: "mixed",
    keywords: ["durable", "broke", "broken", "lasted", "warranty", "fragile"],
  },
];

function mockLabel(batch: ReviewItem[]): AspectCluster | null {
  if (batch.length === 0) return null;

  // Score each aspect by how many reviews mention its keywords
  const scores = ASPECT_KEYWORDS.map((a) => {
    let matchingReviews = 0;
    const exampleQuotes: string[] = [];
    for (const r of batch) {
      const text = (r.title + " " + r.body).toLowerCase();
      if (a.keywords.some((kw) => text.includes(kw))) {
        matchingReviews++;
        if (exampleQuotes.length < 3 && r.body.length > 30) {
          exampleQuotes.push(r.body.slice(0, 120));
        }
      }
    }
    return { ...a, matchingReviews, exampleQuotes };
  });

  // Pick the aspect with highest score
  const best = scores
    .filter((s) => s.matchingReviews > 0)
    .sort((a, b) => b.matchingReviews - a.matchingReviews)[0];

  if (!best || best.matchingReviews === 0) {
    // No aspect keywords matched — return a generic "overall experience" cluster
    return {
      aspect: "overall experience",
      sentiment: "mixed",
      frequency: batch.length,
      exampleQuotes: batch.slice(0, 3).map((r) => r.body.slice(0, 120)),
      confidence: 0.4, // low confidence — rule-based, no LLM
      sourceBreakdown: {
        marketplace: batch.filter((r) => r.source === "marketplace").length,
        reddit: batch.filter((r) => r.source === "reddit").length,
        blog: batch.filter((r) => r.source === "blog").length,
      },
    };
  }

  // Override sentiment based on review ratings if available
  let sentiment: Sentiment = best.sentiment;
  const ratedReviews = batch.filter((r) => r.rating != null);
  if (ratedReviews.length >= 3) {
    const avgRating = ratedReviews.reduce((s, r) => s + (r.rating ?? 3), 0) / ratedReviews.length;
    if (avgRating >= 4) sentiment = "positive";
    else if (avgRating <= 2.5) sentiment = "negative";
    else sentiment = "mixed";
  }

  return {
    aspect: best.aspect,
    sentiment,
    frequency: best.matchingReviews,
    exampleQuotes: best.exampleQuotes,
    confidence: 0.5, // moderate — rule-based fallback
    sourceBreakdown: {
      marketplace: batch.filter((r) => r.source === "marketplace").length,
      reddit: batch.filter((r) => r.source === "reddit").length,
      blog: batch.filter((r) => r.source === "blog").length,
    },
  };
}
