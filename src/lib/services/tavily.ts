import { isServiceAvailable } from "../config";
import { withRetry, withTimeout } from "../retry";

/**
 * Tavily — fallback search API when Serper fails or is rate-limited.
 */

const TAVILY_URL = "https://api.tavily.com/search";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function tavilySearch(
  query: string,
  opts: { maxResults?: number; searchDepth?: "basic" | "advanced" } = {},
): Promise<{ results: TavilyResult[]; demoMode: boolean; cost: number }> {
  if (!isServiceAvailable("TAVILY")) {
    return mockSearch(query);
  }

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(TAVILY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: opts.searchDepth ?? "basic",
            max_results: opts.maxResults ?? 5,
            include_answer: false,
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

  if (!res.ok) return { results: [], demoMode: false, cost: 0 };

  const data = res.value as any;
  const results: TavilyResult[] = (data.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score ?? 0,
  }));

  return { results, demoMode: false, cost: 0.005 };
}

function mockSearch(query: string) {
  return {
    results: [
      {
        title: `Reddit thread: thoughts on ${query}?`,
        url: `https://www.reddit.com/r/BuyItForLife/comments/mock_${hash(query)}`,
        content: `Honestly, after 6 months of using ${query}, the build quality is great but battery life disappointed me. Compared to alternatives, it's mid-tier at best.`,
        score: 0.92,
      },
      {
        title: `Blog: hands-on review of ${query}`,
        url: `https://example-blog.com/${hash(query)}`,
        content: `After two weeks of testing, ${query} offers solid value. Connectivity could be better but the audio quality is genuinely impressive at this price point.`,
        score: 0.88,
      },
    ],
    demoMode: true,
    cost: 0,
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 10000;
}
