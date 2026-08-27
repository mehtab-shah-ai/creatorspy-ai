import { isServiceAvailable } from "../config";
import { withRetry, withTimeout } from "../retry";

/**
 * Serper — Google Shopping API for competitor auto-discovery.
 *
 * FIX 2A: Use Google search operators (site:amazon.in / site:flipkart.com)
 *         with price-hint queries so results are filtered to actual product
 *         listing pages on the target platform — not generic web results.
 *
 * FIX 2B: Use Serper's /shopping endpoint (returns structured product cards
 *         with title/price/rating/source directly — much cleaner than parsing
 *         generic web snippets).
 *
 * FIX 2C: When Serper returns 0 qualifying results, the caller (competitorResolver)
 *         will retry via Tavily with the same site: restriction.
 */

const SERPER_SHOPPING_URL = "https://google.serper.dev/shopping";
const SERPER_SEARCH_URL = "https://google.serper.dev/search";

export interface SerperProduct {
  title: string;
  link: string;
  source: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  // Extra fields for verification downstream
  categoryHint?: string;
  merchant?: string;
}

export interface FindCompetitorsOptions {
  productName: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  platform?: "amazon" | "flipkart" | "both";
  count?: number;
}

export async function findCompetitors(
  opts: FindCompetitorsOptions,
): Promise<{ products: SerperProduct[]; demoMode: boolean; cost: number; queries: string[] }> {
  const count = opts.count ?? 5;

  if (!isServiceAvailable("SERPER")) {
    return mockFind(opts, count);
  }

  // Build queries for each target platform using site: operator.
  // FIX 2A: site:amazon.in / site:flipkart.com — restricts to product listings
  // Price hint appended for tighter relevance.
  const platforms: ("amazon" | "flipkart")[] =
    opts.platform === "amazon" ? ["amazon"] :
    opts.platform === "flipkart" ? ["flipkart"] :
    ["amazon", "flipkart"];

  const queries: string[] = [];
  for (const p of platforms) {
    const site = p === "amazon" ? "amazon.in" : "flipkart.com";
    let q = `site:${site} "${opts.productName}"`;
    if (opts.category) {
      q += ` ${opts.category}`;
    }
    if (opts.priceMax) {
      q += ` under ₹${opts.priceMax}`;
    }
    queries.push(q);
  }

  console.log(`[serper] Queries with site: restriction:`, queries);

  // Fire all queries in parallel — Serper shopping endpoint
  const tasks = queries.map((q) => callSerperShopping(q, count));
  const results = await Promise.allSettled(tasks);

  const allProducts: SerperProduct[] = [];
  let totalCost = 0;

  for (const r of results) {
    if (r.status === "fulfilled") {
      allProducts.push(...r.value.products);
      totalCost += r.value.cost;
    } else {
      console.warn(`[serper] Query failed:`, r.reason?.message);
    }
  }

  // De-duplicate by URL, take top `count`
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    if (seen.has(p.link)) return false;
    seen.add(p.link);
    return true;
  }).slice(0, count);

  // FIX 2C: If Serper returns 0 qualifying results, signal to caller.
  // Caller (competitorResolver) will retry via Tavily with same site: restriction.
  if (unique.length === 0) {
    console.warn(`[serper] 0 qualifying results from ${queries.length} queries. Caller should retry via Tavily.`);
  }

  return { products: unique, demoMode: false, cost: totalCost, queries };
}

// ---------- Serper /shopping endpoint (preferred — structured product data) ----------

async function callSerperShopping(
  query: string,
  count: number,
): Promise<{ products: SerperProduct[]; cost: number }> {
  const res = await withRetry(
    () =>
      withTimeout(
        fetch(SERPER_SHOPPING_URL, {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query, gl: "in", hl: "en-in", num: count + 5 }),
        }).then(async (r) => {
          if (!r.ok) {
            const e: any = new Error(`Serper/shopping ${r.status}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        15_000,
        "serper-shopping",
      ),
    { label: "serper-shopping" },
  );

  if (!res.ok) return { products: [], cost: 0 };

  const data = res.value as any;
  const shopping = (data.shopping ?? []) as any[];

  const products: SerperProduct[] = shopping.map((s) => ({
    title: s.title ?? "",
    link: s.link ?? s.url ?? "",
    source: s.source ?? (s.merchant ?? ""),
    price: typeof s.price === "number" ? s.price : parsePrice(s.price),
    currency: "INR", // gl=in so results are Indian
    imageUrl: s.imageUrl,
    rating: s.rating,
    ratingCount: s.ratingCount,
    merchant: s.merchant,
  })).filter((p) => p.title && p.link);

  return { products, cost: 0.004 }; // ~$0.004 per shopping search
}

function parsePrice(s: any): number | undefined {
  if (typeof s !== "string") return undefined;
  // Strip ₹, commas, spaces → parse as number
  const cleaned = s.replace(/[₹$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

// ---------- Demo-mode mock ----------

function mockFind(opts: FindCompetitorsOptions, count: number) {
  const platform = opts.platform ?? "both";
  const platforms: ("amazon" | "flipkart")[] =
    platform === "amazon" ? ["amazon"] :
    platform === "flipkart" ? ["flipkart"] :
    ["amazon", "flipkart"];

  // Build mock queries (for logging visibility)
  const queries: string[] = platforms.map((p) => {
    const site = p === "amazon" ? "amazon.in" : "flipkart.com";
    let q = `site:${site} "${opts.productName}"`;
    if (opts.category) q += ` ${opts.category}`;
    if (opts.priceMax) q += ` under ₹${opts.priceMax}`;
    return q;
  });
  console.log(`[serper] DEMO MODE — would have sent queries:`, queries);

  // Generate plausible competitor products within price range
  const competitors = ["Sony", "Bose", "JBL", "Sennheiser", "boAt", "Noise", "pTron", "Realme"];
  const picked = competitors.slice(0, count);

  const products: SerperProduct[] = picked.flatMap((brand, i) => {
    const p = platforms[i % platforms.length]!;
    const domain = p === "amazon" ? "amazon.in" : "flipkart.com";
    const priceRange = (opts.priceMax ?? 1000) - (opts.priceMin ?? 0);
    const price = Math.round((opts.priceMin ?? 100) + Math.random() * priceRange);
    return [{
      title: `${brand} ${opts.productName}`,
      link: `https://www.${domain}/dp/MOCK${brand.toUpperCase().slice(0, 6)}${i}`,
      source: domain,
      price,
      currency: "INR",
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      ratingCount: Math.floor(50 + Math.random() * 5000),
      merchant: brand,
    }];
  });

  return { products, demoMode: true, cost: 0, queries };
}
