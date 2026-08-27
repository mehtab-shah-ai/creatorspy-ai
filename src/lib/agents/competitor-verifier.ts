import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { groqJson } from "../services/groq";
import { embedReviews } from "./clustering";
import type { SerperProduct } from "../services/serper";

/**
 * FIX 3 — Competitor Verification Node.
 *
 * Inserts between competitorResolver and scraper. Prevents analyzing the wrong
 * product by filtering candidates through three cheap-to-expensive steps:
 *
 *   Step A — Structural filter (no LLM, no API):
 *     - For each candidate, parse its domain + URL path to confirm it's on the
 *       target platform (amazon.in / flipkart.com) — discards anything else.
 *     - If candidate has a price and it's outside user's price range (±20%
 *       tolerance), discard.
 *
 *   Step B — Semantic relevance filter (free — uses HF embeddings already in use):
 *     - Compute embedding similarity between user's productName and each
 *       surviving candidate's title. Below threshold (0.6 cosine sim) → discard.
 *
 *   Step C — Final LLM confirmation (Groq, cheap/fast, ONE batched call):
 *     - For surviving 3-5 candidates, ask Groq: "Is each a genuinely comparable
 *       competitor (same category, similar use-case)? yes/no + reason."
 *     - Only "yes" candidates proceed to Scraper.
 *
 * If fewer than 1 candidate survives → set verificationMessage and the graph
 * short-circuits to costLogger (no scraping happens, no Apify credits spent).
 */
export async function competitorVerifierNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "competitorVerifier", async (s) => {
    const candidates = s.candidateCompetitors ?? [];

    if (candidates.length === 0) {
      return {
        result: {
          verificationMessage: "No competitors were found to verify. Try pasting direct links instead of auto-find.",
          validatedProducts: s.validatedProducts,
        },
        cost: 0,
        metadata: { step: "empty_input", candidates: 0 },
      };
    }

    // ---------- Step A: Structural filter (free, instant) ----------
    const platformTargets = platformDomains(s.platformPref ?? "both");
    const priceTolerance = 0.20; // ±20%

    const stepA: SerperProduct[] = [];
    for (const c of candidates) {
      // Domain check
      const domain = safeDomain(c.link);
      const onTargetPlatform = platformTargets.some((t) => domain.endsWith(t));
      if (!onTargetPlatform) {
        console.log(`[verifier] Step A: discarded "${c.title.slice(0, 60)}" — domain ${domain} not in ${platformTargets.join(", ")}`);
        continue;
      }

      // Price check (only if candidate has price + user gave price range)
      if (c.price != null && s.priceMin != null && s.priceMax != null) {
        const lowerBound = s.priceMin * (1 - priceTolerance);
        const upperBound = s.priceMax * (1 + priceTolerance);
        if (c.price < lowerBound || c.price > upperBound) {
          console.log(`[verifier] Step A: discarded "${c.title.slice(0, 60)}" — price ₹${c.price} outside [₹${lowerBound.toFixed(0)}, ₹${upperBound.toFixed(0)}]`);
          continue;
        }
      }

      stepA.push(c);
    }

    if (stepA.length === 0) {
      return {
        result: {
          verificationMessage: `Couldn't confidently identify a comparable competitor — none of the search results were on ${platformTargets.join(" / ")} within your price range. Try pasting direct links instead of auto-find.`,
          validatedProducts: s.validatedProducts,
        },
        cost: 0,
        metadata: { step: "A_reject_all", candidates: candidates.length, survived: 0 },
      };
    }

    console.log(`[verifier] Step A: ${stepA.length}/${candidates.length} survived structural filter`);

    // ---------- Step B: Semantic relevance filter (free, uses HF embeddings) ----------
    const userQuery = s.productName ?? s.validatedProducts[0]?.name ?? "";
    let stepBSurvivors: SerperProduct[] = stepA;

    if (userQuery && stepA.length > 1) {
      const texts = [userQuery, ...stepA.map((c) => c.title || extractTitleFromUrl(c.link))];
      const { embeddings, demoMode } = await embedReviews(texts);

      if (!demoMode && embeddings.length === texts.length) {
        const userEmb = embeddings[0]!;
        const threshold = 0.6; // cosine sim threshold (tunable)
        const stepB: SerperProduct[] = [];

        for (let i = 0; i < stepA.length; i++) {
          const candEmb = embeddings[i + 1]!;
          const sim = cosineSim(userEmb, candEmb);
          if (sim >= threshold) {
            stepB.push(stepA[i]!);
          } else {
            console.log(`[verifier] Step B: discarded "${stepA[i]!.title.slice(0, 60)}" — sim ${sim.toFixed(3)} < ${threshold}`);
          }
        }

        if (stepB.length === 0) {
          return {
            result: {
              verificationMessage: `Couldn't confidently identify a comparable competitor — none of the search results were semantically similar enough to "${userQuery}". Try pasting direct links instead of auto-find.`,
              validatedProducts: s.validatedProducts,
            },
            cost: 0,
            metadata: { step: "B_reject_all", candidates: candidates.length, survivedA: stepA.length, survivedB: 0 },
          };
        }

        console.log(`[verifier] Step B: ${stepB.length}/${stepA.length} survived semantic filter (threshold ${threshold})`);
        stepBSurvivors = stepB;
      } else {
        console.log(`[verifier] Step B: skipped (demo mode or no embeddings)`);
      }
    } else {
      console.log(`[verifier] Step B: skipped (no user query or only 1 candidate)`);
    }

    // ---------- Step C: LLM confirmation (Groq, cheap, ONE batched call) ----------
    const llmResult = await llmConfirmCompetitors({
      userProductName: userQuery,
      userCategory: s.category ?? "",
      userPriceMin: s.priceMin,
      userPriceMax: s.priceMax,
      candidates: stepBSurvivors,
    });

    const confirmed: SerperProduct[] = [];
    for (let i = 0; i < stepBSurvivors.length; i++) {
      const verdict = llmResult.verdicts?.[i];
      if (verdict?.isComparable === true) {
        confirmed.push(stepBSurvivors[i]!);
      } else {
        console.log(`[verifier] Step C: discarded "${stepBSurvivors[i]!.title.slice(0, 60)}" — LLM: ${verdict?.reason ?? "no verdict"}`);
      }
    }

    if (confirmed.length === 0) {
      return {
        result: {
          verificationMessage: `Couldn't confidently identify a comparable competitor — the LLM check found that none of the search results genuinely match your product's category and use-case. Try pasting direct links instead of auto-find.`,
          validatedProducts: s.validatedProducts,
        },
        cost: llmResult.cost,
        metadata: {
          step: "C_reject_all",
          candidates: candidates.length,
          survivedA: stepA.length,
          survivedB: stepBSurvivors.length,
          llmVerdicts: llmResult.verdicts,
        },
      };
    }

    console.log(`[verifier] Step C: ${confirmed.length}/${stepBSurvivors.length} confirmed by LLM`);

    // ---------- Build final validatedProducts (your_product + confirmed competitors) ----------
    const yourProduct = s.validatedProducts[0]!;
    const resolved = [
      yourProduct,
      ...confirmed.slice(0, 3).map((c) => ({
        input: c.link,
        role: "competitor" as const,
        url: c.link,
        name: c.title || extractTitleFromUrl(c.link),
        platform: detectPlatform(c.link),
        expectedPrice: c.price,        // pass through so scraper mock uses this price
        expectedCurrency: c.currency,  // pass through
      })),
    ];

    return {
      result: {
        validatedProducts: resolved,
        verificationMessage: undefined,
      },
      cost: llmResult.cost,
      metadata: {
        step: "complete",
        candidates: candidates.length,
        survivedA: stepA.length,
        survivedB: stepBSurvivors.length,
        confirmed: confirmed.length,
      },
    };
  });
}

// ---------- Helpers ----------

function platformDomains(pref: "amazon" | "flipkart" | "both"): string[] {
  if (pref === "amazon") return ["amazon.in", "amazon.com"];
  if (pref === "flipkart") return ["flipkart.com"];
  return ["amazon.in", "amazon.com", "flipkart.com"];
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function detectPlatform(url: string): string {
  const d = safeDomain(url);
  if (d.includes("amazon")) return "amazon";
  if (d.includes("flipkart")) return "flipkart";
  return "unknown";
}

function extractTitleFromUrl(url: string): string {
  // Try to extract a readable title from URL path (Flipkart URLs have product-name-in-path)
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    // Flipkart: /product-name/p/itemid → first segment
    // Amazon: /dp/ASIN → ASIN
    if (segments.length > 0) {
      return segments[0]!.replace(/-/g, " ").replace(/_/g, " ");
    }
  } catch {}
  return url.slice(-40);
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------- Step C: LLM confirmation ----------

interface LlmConfirmResult {
  verdicts: { isComparable: boolean; reason: string }[] | null;
  cost: number;
}

async function llmConfirmCompetitors(args: {
  userProductName: string;
  userCategory: string;
  userPriceMin?: number;
  userPriceMax?: number;
  candidates: SerperProduct[];
}): Promise<LlmConfirmResult> {
  if (args.candidates.length === 0) {
    return { verdicts: [], cost: 0 };
  }

  const systemPrompt = `You are a competitive intelligence analyst. Given a user's product description and a list of candidate competitor products, decide for each candidate whether it is a GENUINELY COMPARABLE competitor — same category, similar use-case, similar price band.

Return ONLY valid JSON in this shape:
{"verdicts": [{"isComparable": boolean, "reason": "one-line explanation"}, ...]}

The verdicts array MUST have exactly the same length as the candidates array, in the same order.`;

  const userPrompt = `User's product: "${args.userProductName}"
Category: ${args.userCategory || "(unspecified)"}
Price range: ${args.priceMin != null ? `₹${args.priceMin}` : "?"} - ${args.priceMax != null ? `₹${args.priceMax}` : "?"}

Candidate competitor products (in order):
${args.candidates.map((c, i) => `${i + 1}. "${c.title || "(no title)"}" — ${c.link}${c.price != null ? ` (₹${c.price})` : ""}`).join("\n")}

For each candidate, is it a genuinely comparable competitor to the user's product? Consider: same product category, similar use-case, plausible price range. Return JSON.`;

  const res = await groqJson<{ verdicts: { isComparable: boolean; reason: string }[] }>(
    systemPrompt,
    userPrompt,
    { temperature: 0.1, maxTokens: 800, timeoutMs: 25_000 },
  );

  if (!res.data || !Array.isArray(res.data.verdicts)) {
    // Fallback: if LLM fails, accept all survivors from Step B (don't block pipeline on LLM failure)
    console.warn(`[verifier] Step C: LLM failed (${res.error ?? "no data"}) — accepting all Step B survivors as fallback`);
    return {
      verdicts: args.candidates.map(() => ({ isComparable: true, reason: "LLM unavailable — accepted as fallback" })),
      cost: res.cost,
    };
  }

  return { verdicts: res.data.verdicts, cost: res.cost };
}
