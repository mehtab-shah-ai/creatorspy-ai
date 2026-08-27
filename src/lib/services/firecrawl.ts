import { isServiceAvailable } from "../config";
import { withRetry, withTimeout } from "../retry";

/**
 * Firecrawl — crawl Reddit / blog / YouTube pages for organic sentiment.
 * Two accounts (FIRECRAWL_API_KEY_1 + _2) used as independent sources so
 * a single account outage doesn't kill both.
 */

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";

export interface FirecrawlResult {
  url: string;
  markdown: string;
  source: "reddit" | "blog";
  sentences: string[];
}

export async function firecrawlSearch(
  query: string,
  account: 1 | 2,
  opts: { limit?: number; source?: "reddit" | "blog" } = {},
): Promise<{ results: FirecrawlResult[]; demoMode: boolean; cost: number }> {
  const key = account === 1 ? process.env.FIRECRAWL_API_KEY_1 : process.env.FIRECRAWL_API_KEY_2;
  const available = account === 1 ? isServiceAvailable("FIRECRAWL_1") : isServiceAvailable("FIRECRAWL_2");

  if (!available) {
    return mockSearch(query, account, opts.source ?? "reddit");
  }

  const url = `${FIRECRAWL_URL}/search`;
  const body = {
    query,
    limit: opts.limit ?? 3,
    scrapeOptions: { formats: ["markdown"] },
  };

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        }).then(async (r) => {
          if (!r.ok) {
            const e: any = new Error(`Firecrawl${account} ${r.status}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        30_000,
        `firecrawl-${account}`,
      ),
    { label: `firecrawl-${account}` },
  );

  if (!res.ok) return { results: [], demoMode: false, cost: 0 };

  const data = res.value as any;
  const items = (data.data ?? []) as any[];
  const results: FirecrawlResult[] = items.map((it) => {
    const u: string = it.url ?? "";
    const markdown: string = it.markdown ?? "";
    const source: "reddit" | "blog" = /reddit\.com/.test(u) ? "reddit" : "blog";
    const sentences = extractSentences(markdown);
    return { url: u, markdown, source, sentences };
  });

  return { results, demoMode: false, cost: 0.016 * (opts.limit ?? 3) };
}

function extractSentences(markdown: string): string[] {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 300);
}

function mockSearch(query: string, account: 1 | 2, source: "reddit" | "blog") {
  const seed = (query.length + account * 7) % 5;
  const redditTemplates = [
    `Day 14 with ${query}: battery is solid but the fit isn't great. Returned.`,
    `Picked up ${query} on sale — surprisingly good for the price. No major complaints so far.`,
    `Anyone else having Bluetooth issues with ${query}? Drops every few minutes.`,
    `${query} vs the competition: honestly the value proposition isn't there.`,
    `Long-term review of ${query}: 6 months in, holding up well. Recommend.`,
  ];
  const blogTemplates = [
    `In our testing of ${query}, we found the build quality above average for the segment.`,
    `${query} delivers on most of its promises, though power users may want more.`,
    `Value for money: ${query} sits in a sweet spot between budget and premium.`,
    `Connectivity was hit-or-miss on ${query}; we'd recommend pairing with a stable device.`,
    `Audio quality of ${query} is genuinely impressive — punches above its weight.`,
  ];
  const pool = source === "reddit" ? redditTemplates : blogTemplates;
  const picked = [pool[seed % pool.length]!, pool[(seed + 2) % pool.length]!];
  return {
    results: picked.map((text, i) => ({
      url:
        source === "reddit"
          ? `https://www.reddit.com/r/gadgets/comments/mock_${seed}_${i}`
          : `https://tech-blog.example.com/${seed}_${i}`,
      markdown: text,
      source,
      sentences: [text],
    })),
    demoMode: true,
    cost: 0,
  };
}
