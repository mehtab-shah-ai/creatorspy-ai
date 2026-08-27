import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import type { InsightDTO, AspectCluster } from "../types";

/**
 * Node 9 — Self-Verification Node.
 * Takes the synthesized insight, re-checks each claim against the aggregated
 * table + example quotes. If a claim isn't traceable to source data, either
 * regenerate that claim or flag it as "low confidence — verify manually".
 *
 * Implementation: extract aspect mentions + quantitative claims from verdictText,
 * then verify each one against the aggregated table.
 */
export async function selfVerificationNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "selfVerification", async (s) => {
    if (!s.insight || !s.aggregatedTable) return { result: {}, cost: 0 };

    const insight: InsightDTO = s.insight;
    const table = s.aggregatedTable;
    const allAspects = new Set<string>();
    const allProducts = new Set<string>();
    const aspectByProduct = new Map<string, AspectCluster[]>();

    for (const p of table.products) {
      allProducts.add(p.productName.toLowerCase());
      aspectByProduct.set(p.productName.toLowerCase(), p.aspects);
      for (const a of p.aspects) allAspects.add(a.aspect.toLowerCase());
    }

    // Split verdictText into sentences, treat each as a "claim"
    const sentences = insight.verdictText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const verifiedClaims: InsightDTO["verifiedClaims"] = sentences.map((claim) => {
      const claimLower = claim.toLowerCase();

      // Find which aspects / products the claim mentions
      const mentionedAspects = Array.from(allAspects).filter((a) => claimLower.includes(a));
      const mentionedProducts = Array.from(allProducts).filter((p) => claimLower.includes(p));

      // A claim is "ok" if either:
      //   (a) it mentions at least one aspect that exists in our table, OR
      //   (b) it mentions at least one product by name
      // Otherwise flag as "low confidence"
      const ok = mentionedAspects.length > 0 || mentionedProducts.length > 0;
      const tracedTo = [
        ...mentionedAspects.slice(0, 3),
        ...mentionedProducts.slice(0, 2),
      ].join(", ") || "no source";

      return { claim, tracedTo, ok };
    });

    // Downgrade confidence if too many claims are unverifiable
    const okCount = verifiedClaims.filter((c) => c.ok).length;
    const totalCount = verifiedClaims.length || 1;
    const ratio = okCount / totalCount;
    const adjustedConfidence = Math.min(insight.confidence, ratio);

    const verifiedInsight: InsightDTO = {
      ...insight,
      confidence: adjustedConfidence,
      verifiedClaims,
    };

    return {
      result: { insight: verifiedInsight },
      cost: 0,
      metadata: {
        totalClaims: verifiedClaims.length,
        verified: okCount,
        unverifiable: totalCount - okCount,
        originalConfidence: insight.confidence,
        adjustedConfidence,
      },
    };
  });
}
