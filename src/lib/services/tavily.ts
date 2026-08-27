import { isServiceAvailable } from "../config";
import { withRetry, withTimeout } from "../retry";
import type { SerperProduct } from "./serper";

/**
 * Tavily — fallback search API when Serper returns 0 qualifying results.
 *
 * FIX 2C: Uses the SAME site: restriction logic as Serper so results stay
 *         filtered to product pages on the target platform.
 */

const TAVILY_URL = "https://api.tavily.com/search";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyCompetitorOptions {
  productName: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  platform?: "amazon" | "flipkart" | "both";
  count?: number;
}

/**
 * Search for competitor product URLs restricted to amazon.in / flipkart.com.
 * Returns SerperProduct-shaped objects so the caller can use the same
 * verification pipeline downstream.
 */
export async function tavilyFindCompetitors(
  opts: TavilyCompetitorOptions,
): Promise<{ products: SerperProduct[]; demoMode: boolean; cost: number; queries: string[] }> {
  if (!isServiceAvailable("TAVILY")) {
    return mockFind(opts);
  }

  const count = opts.count ?? 5;
  const platforms: ("amazon" | "flipkart")[] =
    opts.platform === "amazon" ? ["amazon"] :
    opts.platform === "flipkart" ? ["flipkart"] :
    ["amazon", "flipkart"];

  const queries: string[] = platforms.map((p) => {
    const site = p === "amazon" ? "amazon.in" : "flipkart.com";
    let q = `site:${site} "${opts.productName}"`;
    if (opts.category) q += ` ${opts.category}`;
    if (opts.priceMax) q += ` under ₹${opts.priceMax}`;
    return q;
  });

  console.log(`[tavily] Fallback queries with site: restriction:`, queries);

  const tasks = queries.map((q) => callTavily(q, count));
  const results = await Promise.allSettled(tasks);

  let totalCost = 0;
  const all: SerperProduct[] = [];

  for (const r of results) {
    if (r.status === "fulfilled") {
      all.push(...r.value.products);
      totalCost += r.value.cost;
    }
  }

  // De-dup by URL
  const seen = new Set<string>();
  const unique = all.filter((p) => {
    if (seen.has(p.link)) return false;
    seen.add(p.link);
    return true;
  }).slice(0, count);

  return { products: unique, demoMode: false, cost: totalCost, queries };
}

async function callTavily(
  query: string,
  count: number,
): Promise<{ products: SerperProduct[]; cost: number }> {
  const res = await withRetry(
    () =>
      withTimeout(
        fetch(TAVILY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: "basic",
            max_results: count + 3,
            include_answer: false,
            // Tavily supports domain include/exclude lists — but site: operator in query
            // already restricts results to the right domain.
          }),
        }).then(async (r) => {
          if (!r.ok) {
            const e: any = new Error(`Tavily ${r.status}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        20_000,
        "tavily",
      ),
    { label: "tavily" },
  );

  if (!res.ok) return { products: [], cost: 0 };

  const data = res.value as any;
  const results: TavilyResult[] = (data.results ?? []).map((r: any) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: r.content ?? "",
    score: r.score ?? 0,
  }));

  // Convert Tavily results to SerperProduct shape (no price from Tavily — Scraper
  // step or competitor verification will fetch the actual listing price).
  const products: SerperProduct[] = results.map((r) => ({
    title: r.title,
    link: r.url,
    source: r.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] ?? "unknown",
    price: parsePriceFromContent(r.content),
    currency: "INR",
  }));

  return { products, cost: 0.005 }; // ~$0.005 per basic search
}

function parsePriceFromContent(content: string): number | undefined {
  // Look for ₹X,XXX or Rs. X,XXX patterns
  const match = content.match(/(?:₹|Rs\.?\s*)([\d,]+)/i);
  if (!match) return undefined;
  const n = parseFloat(match[1]!.replace(/,/g, ""));
  return isNaN(n) ? undefined : n;
}

// ---------- Demo-mode mock ----------

function mockFind(opts: TavilyCompetitorOptions) {
  const platforms: ("amazon" | "flipkart")[] =
    opts.platform === "amazon" ? ["amazon"] :
    opts.platform === "flipkart" ? ["flipkart"] :
    ["amazon", "flipkart"];

  const queries: string[] = platforms.map((p) => {
    const site = p === "amazon" ? "amazon.in" : "flipkart.com";
    let q = `site:${site} "${opts.productName}"`;
    if (opts.category) q += ` ${opts.category}`;
    if (opts.priceMax) q += ` under ₹${opts.priceMax}`;
    return q;
  });

  console.log(`[tavily] DEMO MODE — would have sent fallback queries:`, queries);

  const competitors = ["boAt", "Noise", "pTron", "Realme", "Sony", "Bose", "JBL", "Sennheiser"];
  const picked = competitors.slice(0, opts.count ?? 3);
  const products: SerperProduct[] = picked.flatMap((brand, i) => {
    const p = platforms[i % platforms.length]!;
    const domain = p === "amazon" ? "amazon.in" : "flipkart.com";
    const priceRange = (opts.priceMax ?? 1000) - (opts.priceMin ?? 0);
    const price = Math.round((opts.priceMin ?? 100) + Math.random() * priceRange);
    return [{
      title: `${brand} ${opts.productName}`,
      link: `https://www.${domain}/dp/TAVILY${brand.toUpperCase().slice(0, 4)}${i}`,
      source: domain,
      price,
      currency: "INR",
    }];
  });

  return { products, demoMode: true, cost: 0, queries };
}
