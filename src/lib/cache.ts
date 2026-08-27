import { db } from "./db";
import { config } from "./config";

/**
 * 48-hour cache for product scrape results, keyed on ASIN (or normalised URL/name).
 * Hits avoid re-hitting Apify/Serper — this is the primary cost-control mechanism.
 */
export interface CacheHit {
  productId: string;
  cachedUntil: Date;
  rawData: any;
}

export async function readCache(key: string): Promise<CacheHit | null> {
  // Find any product with matching ASIN or URL, cached and not expired.
  const cached = await db.product.findFirst({
    where: {
      OR: [{ asin: key }, { sourceUrl: key }],
      cachedUntil: { gt: new Date() },
    },
    orderBy: { cachedUntil: "desc" },
  });
  if (!cached) return null;
  return {
    productId: cached.id,
    cachedUntil: cached.cachedUntil,
    rawData: JSON.parse(cached.rawDataJson),
  };
}

export async function writeCache(key: string, data: any): Promise<void> {
  // Cache is stored on the Product row itself (cachedUntil column).
  // The scraper agent sets this when it persists the product.
  // This helper is for explicit cache writes if needed.
  const future = new Date(Date.now() + config.cacheTtlMs);
  await db.product.updateMany({
    where: { OR: [{ asin: key }, { sourceUrl: key }] },
    data: { cachedUntil: future, rawDataJson: JSON.stringify(data) },
  });
}

export function cacheKeyFromInput(input: string): string {
  // If it looks like an Amazon URL, extract ASIN. Otherwise normalise.
  const asinMatch = input.match(/\/(?:dp|gp\/product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i);
  if (asinMatch) return asinMatch[1].toUpperCase();
  const flipkartMatch = input.match(/flipkart\.com\/[^?]+/i);
  if (flipkartMatch) return flipkartMatch[0].toLowerCase();
  // Fallback: normalise whitespace and lowercase
  return input.trim().toLowerCase().slice(0, 200);
}
