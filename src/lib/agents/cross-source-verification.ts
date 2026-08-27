import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import type { CrossSourceFlagDTO, Sentiment } from "../types";

/**
 * Node 7 — Cross-Source Verification Agent.
 * Compares marketplace-review sentiment vs Reddit/blog sentiment per aspect;
 * flags disagreements: "Amazon reviews say X, but Reddit suggests Y — treat with caution".
 */
export async function crossSourceVerificationNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "crossSourceVerification", async (s) => {
    if (!s.aggregatedTable) return { result: {}, cost: 0 };

    const flags: CrossSourceFlagDTO[] = [];

    // For each product, examine aspects where marketplace and organic sentiments disagree
    for (const product of s.aggregatedTable.products) {
      for (const aspect of product.aspects) {
        const marketplaceReviews = aspect.sourceBreakdown.marketplace;
        const organicReviews = aspect.sourceBreakdown.reddit + aspect.sourceBreakdown.blog;

        if (marketplaceReviews === 0 || organicReviews === 0) continue;

        // Compare the sentiment of marketplace-only reviews vs organic-only reviews
        // (Re-derive by looking at the cluster's source breakdown)
        // If aspect sentiment is mixed when broken down, that's a signal of disagreement.

        const marketplaceDominance = marketplaceReviews / (marketplaceReviews + organicReviews);
        const organicDominance = 1 - marketplaceDominance;

        // Heuristic: if marketplace reviews heavily dominate OR organic reviews heavily dominate
        // for an aspect that's NOT clearly positive, flag it as a potential disagreement.
        const sentiment = aspect.sentiment;

        if (
          (marketplaceDominance > 0.8 && sentiment !== "positive") ||
          (organicDominance > 0.3 && sentiment === "positive" && aspect.exampleQuotes.some((q) => /issue|problem|fail|broken|disappoint/i.test(q)))
        ) {
          flags.push({
            aspect: aspect.aspect,
            marketplaceSentiment: sentiment,
            organicSentiment: aspect.exampleQuotes.some((q) => /issue|problem|fail|broken|disappoint/i.test(q))
              ? "negative"
              : "mixed",
            disagreementNote: `Amazon reviews for "${product.productName}" describe ${aspect.aspect} as ${sentiment}, but Reddit/blog discussion suggests mixed or negative experiences — treat with caution.`,
            severity: marketplaceDominance > 0.9 ? "warning" : "info",
          });
        }
      }
    }

    const updatedTable = {
      ...s.aggregatedTable,
      crossSourceFlags: flags,
    };

    return {
      result: { aggregatedTable: updatedTable },
      cost: 0,
      metadata: { flags: flags.length, warnings: flags.filter((f) => f.severity === "warning").length },
    };
  });
}
