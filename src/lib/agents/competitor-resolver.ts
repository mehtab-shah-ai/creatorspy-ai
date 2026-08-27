import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { findCompetitors } from "../services/serper";
import { tavilyFindCompetitors } from "../services/tavily";
import type { SerperProduct } from "../services/serper";

/**
 * Node 2 — Competitor Resolver.
 *
 * FIX 2: Builds site:-restricted queries (site:amazon.in / site:flipkart.com)
 *        with price hints → calls Serper /shopping endpoint → falls back to
 *        Tavily with the same site: restriction if Serper returns 0 results.
 *
 * Output: candidateCompetitors[] — populated into state for the NEW
 *         competitorVerifier node (Fix 3) to filter before scraping.
 */
export async function competitorResolverNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "competitorResolver", async (s) => {
    if (!s.autoFind) {
      // User provided competitor links directly — pass them through as candidates.
      // The competitorVerifier node (Fix 3) will still verify them.
      const candidates: SerperProduct[] = s.competitorInputs.map((link) => ({
        title: "",
        link,
        source: detectDomain(link),
      }));
      return {
        result: {
          candidateCompetitors: candidates,
          validatedProducts: s.validatedProducts, // unchanged — your_product already validated
        },
        cost: 0,
        metadata: { source: "user_provided", candidateCount: candidates.length },
      };
    }

    // Auto-find: build structured query from form fields
    const query = s.productName ?? s.validatedProducts[0]?.name ?? s.validatedProducts[0]?.asin ?? "best product";
    const platform = s.platformPref ?? "both";

    let cost = 0;
    let competitors: SerperProduct[] = [];
    let sourceUsed: "serper" | "tavily" = "serper";
    let serperQueries: string[] = [];

    // Primary: Serper /shopping endpoint with site: restriction
    const ser = await findCompetitors({
      productName: query,
      category: s.category,
      priceMin: s.priceMin,
      priceMax: s.priceMax,
      platform,
      count: 5,
    });
    cost += ser.cost;
    serperQueries = ser.queries;

    if (ser.products.length > 0) {
      competitors = ser.products;
    } else {
      // FIX 2C: fallback to Tavily with same site: restriction
      console.log(`[competitorResolver] Serper returned 0 results, falling back to Tavily...`);
      sourceUsed = "tavily";
      const tav = await tavilyFindCompetitors({
        productName: query,
        category: s.category,
        priceMin: s.priceMin,
        priceMax: s.priceMax,
        platform,
        count: 5,
      });
      cost += tav.cost;
      competitors = tav.products;
      serperQueries = [...serperQueries, ...tav.queries];
    }

    return {
      result: {
        candidateCompetitors: competitors,
        validatedProducts: s.validatedProducts,
      },
      cost,
      metadata: {
        source: sourceUsed,
        candidateCount: competitors.length,
        demoMode: ser.demoMode,
        queries: serperQueries,
      },
    };
  });
}

function detectDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
