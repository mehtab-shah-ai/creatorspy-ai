import { isServiceAvailable, config } from "../config";
import { withRetry, withTimeout } from "../retry";
import type { ReviewItem } from "../types";

/**
 * Apify — primary structured scrape source for Amazon / Flipkart.
 * Actor: `muhammetakkurtt/amazon-reviews-scraper` (free-tier compatible).
 * Falls back to deterministic mock data when APIFY_API_TOKEN is missing.
 */

const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyReview {
  id?: string;
  authorName?: string;
  rating?: number;
  title?: string;
  reviewText?: string;
  date?: string;
  verifiedPurchase?: boolean;
}

interface ApifyProductInfo {
  title?: string;
  asin?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
}

export interface ApifyScrapeResult {
  reviews: ReviewItem[];
  productInfo: ApifyProductInfo | undefined;
  demoMode: boolean;
  cost: number;
  errorMessage?: string;
}

export async function scrapeAmazonReviews(
  asinOrUrl: string,
  maxReviews = config.maxReviewsPerProduct,
): Promise<ApifyScrapeResult> {
  if (!isServiceAvailable("APIFY")) {
    return mockScrape(asinOrUrl, maxReviews);
  }

  const asinMatch = asinOrUrl.match(/([A-Z0-9]{10})/i);
  const asin = asinMatch ? asinMatch[1]!.toUpperCase() : asinOrUrl;

  const actorId = "muhammetakkurtt/amazon-reviews-scraper";
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-datasets-items?token=${process.env.APIFY_API_TOKEN}`;

  const result = await withRetry(
    () =>
      withTimeout(
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asin,
            maxReviews,
            reviewOrigin: "all",
            sort: "TOP",
            saveAsinData: true,
          }),
        }).then(async (r) => {
          if (!r.ok) {
            const errBody = await r.text().catch(() => "");
            const e: any = new Error(`Apify ${r.status}: ${errBody.slice(0, 200)}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        60_000,
        "apify-scrape",
      ),
    { maxRetries: config.maxRetries, label: "apify-scrape" },
  );

  if (!result.ok) {
    // Worst-case 1: Apify fails — return empty + error so caller can degrade gracefully
    return {
      reviews: [],
      productInfo: undefined,
      demoMode: false,
      cost: 0,
      errorMessage: result.error.message,
    };
  }

  const data = result.value as any;
  const items: ApifyReview[] = Array.isArray(data) ? data : data.reviews ?? [];
  const productInfo: ApifyProductInfo | undefined = Array.isArray(data) ? undefined : data.productInfo;

  const reviews: ReviewItem[] = items.slice(0, maxReviews).map((r, i) => ({
    id: r.id ?? `apify-${i}`,
    author: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.reviewText ?? "",
    date: r.date,
    verifiedPurchase: r.verifiedPurchase,
    source: "marketplace" as const,
  }));

  const cost = (reviews.length / 100) * 0.0007;

  return { reviews, productInfo, demoMode: false, cost };
}

// ---------- Demo-mode mock ----------

function mockScrape(input: string, maxReviews: number): ApifyScrapeResult {
  const asinMatch = input.match(/([A-Z0-9]{10})/i);
  const asin = asinMatch ? asinMatch[1]!.toUpperCase() : `MOCK${input.slice(0, 5).toUpperCase()}`;

  const seed = hashString(input);
  const rng = mulberry32(seed);

  const aspects = [
    { aspect: "battery life", sentiment: "positive" as const, templates: [
      "Battery easily lasts me 2+ days with normal use — very impressed.",
      "The standby time is incredible, lasts the whole work week.",
      "Charges fast and lasts long — exactly what I needed.",
    ]},
    { aspect: "build quality", sentiment: "mixed" as const, templates: [
      "Feels premium but the hinge creaks after a month.",
      "Solid metal body, but the buttons feel mushy.",
      "Looks great but the plastic feels a bit cheap.",
    ]},
    { aspect: "value for money", sentiment: "positive" as const, templates: [
      "Worth every penny — better than competitors at 2x the price.",
      "Great features for the price bracket, would recommend.",
      "For this price, you can't do better.",
    ]},
    { aspect: "sound quality", sentiment: "positive" as const, templates: [
      "Crisp highs, punchy bass — better than expected.",
      "Audio is clear and loud, no distortion at max volume.",
      "The sound signature is warm and detailed — love it.",
    ]},
    { aspect: "comfort", sentiment: "negative" as const, templates: [
      "Hurts my ears after 30 min — too tight.",
      "Ear cushions are stiff, can't wear for long calls.",
      "The headband digs into my scalp after an hour.",
    ]},
    { aspect: "connectivity", sentiment: "negative" as const, templates: [
      "Drops connection every 10 min — extremely frustrating.",
      "Bluetooth pairing is unreliable, had to factory reset twice.",
      "Won't stay connected to my laptop — major issue.",
    ]},
  ];

  const reviewCount = Math.min(maxReviews, 80 + Math.floor(rng() * 120));
  const reviews: ReviewItem[] = Array.from({ length: reviewCount }).map((_, i) => {
    const a = aspects[Math.floor(rng() * aspects.length)]!;
    const tmpl = a.templates[Math.floor(rng() * a.templates.length)]!;
    return {
      id: `mock-${asin}-${i}`,
      author: `Reviewer${i}`,
      rating: a.sentiment === "positive" ? 5 : a.sentiment === "negative" ? 2 : 3,
      title: `${a.aspect} — ${a.sentiment}`,
      body: tmpl,
      date: new Date(Date.now() - Math.floor(rng() * 365) * 86400000).toISOString(),
      verifiedPurchase: rng() > 0.3,
      source: "marketplace" as const,
    };
  });

  return {
    reviews,
    productInfo: {
      title: `Demo Product (${asin})`,
      asin,
      price: Math.floor(20 + rng() * 200),
      currency: "USD",
      rating: Number((3 + rng() * 1.8).toFixed(1)),
      reviewsCount: reviewCount,
      imageUrl: undefined,
    },
    demoMode: true,
    cost: 0,
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
