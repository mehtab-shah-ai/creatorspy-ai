import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import type { AspectCluster, AggregatedTable, ProductAspectSummary, CrossSourceFlagDTO, ProductSnapshot } from "../types";

/**
 * Node 6 — Aggregation Node (pure code, NO LLM).
 * Combines per-cluster JSON into one comparison table across all products.
 * Numbers are deterministic and verifiable.
 */
export async function aggregationNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "aggregation", async (s) => {
    const summaries: ProductAspectSummary[] = [];

    for (let i = 0; i < s.products.length; i++) {
      const p: ProductSnapshot = s.products[i]!;
      const clusters: AspectCluster[] = s.clustersByProduct[i] ?? [];

      // De-duplicate aspects (clusters may have slight variations like "battery" / "battery life")
      const merged = mergeAspects(clusters);

      const topComplaints = merged
        .filter((c) => c.sentiment === "negative" || c.sentiment === "mixed")
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      const topPraises = merged
        .filter((c) => c.sentiment === "positive")
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      summaries.push({
        productId: p.asin ?? p.url ?? `product-${i}`,
        productName: p.name ?? `Product ${i + 1}`,
        role: i === 0 ? "your_product" : "competitor",
        price: p.price,
        currency: p.currency,
        rating: p.rating,
        reviewCount: p.reviewCount,
        dataQuality: p.dataQuality,
        aspects: merged,
        topComplaints,
        topPraises,
      });
    }

    // Union of all aspects across products (for the comparison chart)
    const aspectSet = new Set<string>();
    for (const s of summaries) {
      for (const a of s.aspects) aspectSet.add(a.aspect);
    }

    const aggregatedTable: AggregatedTable = {
      products: summaries,
      aspects: Array.from(aspectSet).sort(),
      crossSourceFlags: [], // populated by next node
    };

    return {
      result: { aggregatedTable },
      cost: 0,
      metadata: {
        products: summaries.length,
        aspects: aspectSet.size,
        complaints: summaries.reduce((s, p) => s + p.topComplaints.length, 0),
      },
    };
  });
}

function mergeAspects(clusters: AspectCluster[]): AspectCluster[] {
  const map = new Map<string, AspectCluster>();

  for (const c of clusters) {
    const key = c.aspect.toLowerCase().trim();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...c });
    } else {
      // Merge: sum frequencies, keep highest-confidence quotes
      existing.frequency += c.frequency;
      existing.sourceBreakdown = {
        marketplace: existing.sourceBreakdown.marketplace + c.sourceBreakdown.marketplace,
        reddit: existing.sourceBreakdown.reddit + c.sourceBreakdown.reddit,
        blog: existing.sourceBreakdown.blog + c.sourceBreakdown.blog,
      };
      existing.exampleQuotes = [...existing.exampleQuotes, ...c.exampleQuotes].slice(0, 4);
      // Update sentiment to dominant (more reviews = more weight)
      if (c.frequency > existing.frequency / 2) {
        existing.sentiment = c.sentiment;
      }
      existing.confidence = Math.max(existing.confidence, c.confidence);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.frequency - a.frequency);
}
