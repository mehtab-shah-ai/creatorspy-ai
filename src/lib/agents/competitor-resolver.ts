import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { findCompetitors } from "../services/serper";
import { tavilySearch } from "../services/tavily";
import type { SerperProduct } from "../services/serper";

/**
 * Node 2 — Competitor Resolver.
 * If user gave competitor links, use them.
 * If "auto-find" selected → Serper (Google Shopping) → fallback Tavily if Serper fails.
 */
export async function competitorResolverNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "competitorResolver", async (s) => {
    if (!s.autoFind) {
      // Competitors already validated by inputValidator
      return {
        result: { validatedProducts: s.validatedProducts },
        cost: 0,
        metadata: { source: "user_provided" },
      };
    }

    // Auto-find: derive query from your_product input
    const yourProduct = s.validatedProducts[0];
    if (!yourProduct) throw new Error("No your-product found in validated products");
    const query = yourProduct.name ?? yourProduct.asin ?? yourProduct.url ?? "best product";

    let cost = 0;
    let competitors: SerperProduct[] = [];
    let sourceUsed: "serper" | "tavily" = "serper";

    // Primary: Serper
    const ser = await findCompetitors(query, 3);
    cost += ser.cost;
    if (ser.products.length > 0) {
      competitors = ser.products;
    } else {
      // Fallback: Tavily
      sourceUsed = "tavily";
      const tav = await tavilySearch(`${query} best alternatives buy`);
      cost += tav.cost;
      competitors = tav.results.slice(0, 3).map((r) => ({
        title: r.title,
        link: r.url,
        source: "web",
        price: 0,
        currency: "USD",
      }));
    }

    // Add resolved competitors to validatedProducts list
    const resolved = [
      yourProduct,
      ...competitors.map((c) => ({
        input: c.link,
        role: "competitor" as const,
        url: c.link,
        name: c.title,
        platform: detectPlatform(c.link),
      })),
    ];

    return {
      result: { validatedProducts: resolved },
      cost,
      metadata: {
        source: sourceUsed,
        resolvedCount: competitors.length,
        demoMode: ser.demoMode,
      },
    };
  });
}

function detectPlatform(url: string): string {
  if (/amazon\./i.test(url)) return "amazon";
  if (/flipkart\./i.test(url)) return "flipkart";
  return "unknown";
}
