import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { scrapeAmazonReviews } from "../services/apify";
import { firecrawlSearch } from "../services/firecrawl";
import { readCache, cacheKeyFromInput } from "../cache";
import { config } from "../config";
import type { ProductSnapshot, ReviewItem } from "../types";

/**
 * Node 3 — Scraper Agent (parallel fan-out).
 * For your product + each competitor, run concurrently via Promise.all:
 *   ├─ Apify: pull up to 400 reviews + price/rating
 *   ├─ Firecrawl #1: crawl Reddit threads for organic sentiment
 *   └─ Firecrawl #2: crawl blog/YouTube pages as independent second source
 *
 * On any source failure: log it, continue with remaining sources, mark that
 * product's dataQuality as "partial" (or "limited" if Apify returns 0 reviews).
 *
 * Cache check happens per-product BEFORE hitting Apify (48h TTL via SQLite).
 */
export async function scraperNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "scraper", async (s) => {
    const products = s.validatedProducts;

    // Parallel fan-out — one async task per product
    const tasks = products.map((p) => scrapeOneProduct(p.input, p.role, p.platform, p.name, p.asin, p.url));
    const results = await Promise.allSettled(tasks);

    let totalCost = 0;
    let cacheHits = 0;
    let cacheMisses = 0;
    const snapshots: ProductSnapshot[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      if (r.status === "fulfilled") {
        totalCost += r.value.cost;
        cacheHits += r.value.cacheHit ? 1 : 0;
        cacheMisses += r.value.cacheHit ? 0 : 1;
        snapshots.push(r.value.snapshot);
      } else {
        // Worst-case 2: All scraping sources fail for one competitor
        // → still return comparison for products that succeeded
        const input = products[i]!;
        console.error(`[scraper] All sources failed for "${input.input}": ${r.reason}`);
        snapshots.push({
          name: input.name ?? input.input,
          asin: input.asin,
          url: input.url,
          platform: input.platform as any,
          price: undefined,
          rating: undefined,
          reviewCount: 0,
          reviews: [],
          organicSentences: [],
          dataQuality: "limited",
          errorMessage: r.reason?.message ?? "All scraping sources failed",
        });
      }
    }

    return {
      result: {
        products: snapshots,
        cacheHits,
        cacheMisses,
      },
      cost: totalCost,
      metadata: {
        productsScraped: snapshots.length,
        cacheHits,
        cacheMisses,
        qualities: snapshots.map((p) => p.dataQuality),
      },
    };
  });
}

interface ScrapeResult {
  snapshot: ProductSnapshot;
  cost: number;
  cacheHit: boolean;
}

async function scrapeOneProduct(
  input: string,
  role: "your_product" | "competitor",
  platform: string,
  name?: string,
  asin?: string,
  url?: string,
): Promise<ScrapeResult> {
  // Cache check (48h TTL)
  const cacheKey = asin ?? cacheKeyFromInput(input);
  const cached = await readCache(cacheKey);

  if (cached) {
    const snapshot: ProductSnapshot = cached.rawData as ProductSnapshot;
    return { snapshot, cost: 0, cacheHit: true };
  }

  // Fan out: Apify + Firecrawl #1 + Firecrawl #2 in parallel
  const [apifyRes, firecrawlReddit, firecrawlBlog] = await Promise.allSettled([
    scrapeAmazonReviews(asin ?? input, config.maxReviewsPerProduct),
    firecrawlSearch(`${name ?? input} review reddit`, 1, { source: "reddit", limit: 3 }),
    firecrawlSearch(`${name ?? input} review blog`, 2, { source: "blog", limit: 2 }),
  ]);

  let cost = 0;
  let reviews: ReviewItem[] = [];
  let productInfo: any = undefined;
  let dataQuality: "full" | "partial" | "limited" = "full";
  let errorMessage: string | undefined;

  // Process Apify result
  if (apifyRes.status === "fulfilled") {
    cost += apifyRes.value.cost;
    reviews = apifyRes.value.reviews;
    productInfo = apifyRes.value.productInfo;
    if (apifyRes.value.errorMessage) {
      dataQuality = "partial";
      errorMessage = apifyRes.value.errorMessage;
    }
    // Worst-case 1: 0 reviews → fall back to Firecrawl-only
    if (reviews.length === 0) {
      dataQuality = "limited";
      if (!errorMessage) errorMessage = "Apify returned 0 reviews";
    }
  } else {
    dataQuality = "partial";
    errorMessage = apifyRes.reason?.message ?? "Apify failed";
  }

  // Collect organic sentences from Firecrawl sources
  const organicSentences: { source: string; url: string; text: string }[] = [];
  if (firecrawlReddit.status === "fulfilled") {
    cost += firecrawlReddit.value.cost;
    for (const r of firecrawlReddit.value.results) {
      for (const s of r.sentences) {
        organicSentences.push({ source: "reddit", url: r.url, text: s });
        reviews.push({
          id: `reddit-${r.url}-${s.slice(0, 20)}`,
          body: s,
          source: "reddit",
        });
      }
    }
  } else {
    // Don't fail the whole product — Firecrawl is secondary source
    if (dataQuality === "full") dataQuality = "partial";
  }

  if (firecrawlBlog.status === "fulfilled") {
    cost += firecrawlBlog.value.cost;
    for (const r of firecrawlBlog.value.results) {
      for (const s of r.sentences) {
        organicSentences.push({ source: "blog", url: r.url, text: s });
        reviews.push({
          id: `blog-${r.url}-${s.slice(0, 20)}`,
          body: s,
          source: "blog",
        });
      }
    }
  } else {
    if (dataQuality === "full") dataQuality = "partial";
  }

  const snapshot: ProductSnapshot = {
    name: productInfo?.title ?? name,
    asin: productInfo?.asin ?? asin,
    url,
    platform: platform as any,
    price: productInfo?.price,
    currency: productInfo?.currency ?? "USD",
    rating: productInfo?.rating,
    reviewCount: productInfo?.reviewsCount ?? reviews.length,
    imageUrl: productInfo?.imageUrl,
    reviews,
    organicSentences,
    dataQuality,
    errorMessage,
  };

  return { snapshot, cost, cacheHit: false };
}
