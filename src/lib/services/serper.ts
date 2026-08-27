import { isServiceAvailable } from "../config";
import { withRetry, withTimeout } from "../retry";

/**
 * Serper — Google Shopping API for competitor auto-discovery.
 */

const SERPER_URL = "https://google.serper.dev/shopping";

export interface SerperProduct {
  title: string;
  link: string;
  source: string;
  price: number;
  currency: string;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
}

export async function findCompetitors(
  productName: string,
  count = 3,
): Promise<{ products: SerperProduct[]; demoMode: boolean; cost: number }> {
  if (!isServiceAvailable("SERPER")) {
    return mockFind(productName, count);
  }

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(SERPER_URL, {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: productName, gl: "us", hl: "en", num: count + 3 }),
        }).then(async (r) => {
          if (!r.ok) {
            const e: any = new Error(`Serper ${r.status}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        15_000,
        "serper",
      ),
    { label: "serper" },
  );

  if (!res.ok) return { products: [], demoMode: false, cost: 0 };

  const data = res.value as any;
  const shopping = (data.shopping ?? []) as any[];
  const products: SerperProduct[] = shopping.slice(0, count).map((s) => ({
    title: s.title,
    link: s.link,
    source: s.source,
    price: s.price,
    currency: s.currency ?? "USD",
    imageUrl: s.imageUrl,
    rating: s.rating,
    ratingCount: s.ratingCount,
  }));

  return { products, demoMode: false, cost: 0.004 };
}

function mockFind(name: string, count: number) {
  const competitors = ["Sony", "Bose", "JBL", "Sennheiser", "Apple", "Samsung", "Anker", "Beats"];
  const picked = competitors.slice(0, count);
  const products: SerperProduct[] = picked.map((brand) => ({
    title: `${brand} ${name} (Competitor)`,
    link: `https://www.amazon.com/dp/MOCK${brand.toUpperCase().slice(0, 6)}XX`,
    source: "Amazon",
    price: Math.floor(30 + Math.random() * 250),
    currency: "USD",
    rating: Number((3 + Math.random() * 2).toFixed(1)),
    ratingCount: Math.floor(50 + Math.random() * 5000),
  }));
  return { products, demoMode: true, cost: 0 };
}
