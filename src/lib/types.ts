/**
 * Shared domain types used across the agent pipeline and the API contract.
 */

export type Platform = "amazon" | "flipkart" | "unknown";

export type ProductRole = "your_product" | "competitor";

export type Sentiment = "positive" | "negative" | "mixed" | "neutral";

export type RunStatus = "pending" | "running" | "completed" | "failed";

export type DataQuality = "full" | "partial" | "limited";

export interface ReviewItem {
  id: string;
  author?: string;
  rating?: number; // 1-5
  title?: string;
  body: string;
  date?: string;
  verifiedPurchase?: boolean;
  source: "marketplace" | "reddit" | "blog";
}

export interface ProductSnapshot {
  name?: string;
  asin?: string;
  url?: string;
  platform: Platform;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  reviews: ReviewItem[];
  organicSentences: { source: string; url: string; text: string }[];
  dataQuality: DataQuality;
  errorMessage?: string;
}

export interface AspectCluster {
  aspect: string;
  sentiment: Sentiment;
  frequency: number;
  exampleQuotes: string[];
  confidence: number;
  sourceBreakdown: { marketplace: number; reddit: number; blog: number };
}

export interface ProductAspectSummary {
  productId: string;
  productName: string;
  sourceUrl?: string;
  role: ProductRole;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount: number;
  dataQuality: DataQuality;
  aspects: AspectCluster[];
  topComplaints: AspectCluster[]; // top negative aspects by frequency
  topPraises: AspectCluster[]; // top positive aspects by frequency
}

export interface CrossSourceFlagDTO {
  aspect: string;
  marketplaceSentiment: Sentiment;
  organicSentiment: Sentiment;
  disagreementNote: string;
  severity: "info" | "warning" | "critical";
}

export interface AggregatedTable {
  products: ProductAspectSummary[];
  aspects: string[]; // union of all aspects across products
  crossSourceFlags: CrossSourceFlagDTO[];
}

export interface InsightOpportunity {
  title: string;
  rationale: string;
  impact: "high" | "medium" | "low";
}

export interface InsightDTO {
  verdictText: string;
  confidence: number;
  opportunities: InsightOpportunity[];
  verifiedClaims: { claim: string; tracedTo: string; ok: boolean }[];
}

export interface NodeLogDTO {
  nodeName: string;
  cost: number;
  latencyMs: number;
  status: "ok" | "error" | "partial" | "skipped";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface RunMetricsDTO {
  totalCost: number;
  totalLatencyMs: number;
  nodeLogs: NodeLogDTO[];
  cacheHits: number;
  cacheMisses: number;
}

export interface RunStatusDTO {
  runId: string;
  status: RunStatus;
  currentNode: string | null;
  progress: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AnalysisResultDTO {
  runId: string;
  status: RunStatus;
  yourProduct: ProductAspectSummary;
  competitors: ProductAspectSummary[];
  aggregatedTable: AggregatedTable;
  insight: InsightDTO | null;
  metrics: RunMetricsDTO;
  dataQuality: DataQuality;
  demoMode: boolean;
}

// ---------- LangGraph state ----------

export type PlatformPref = "amazon" | "flipkart" | "both";

export interface AgentState {
  runId: string;
  userId: string;
  yourProductInput: string;
  competitorInputs: string[];
  autoFind: boolean;

  // FIX 1: structured form fields — power auto-find with relevant results
  productLink?: string;        // optional Amazon.in / Flipkart.com URL
  productName?: string;        // required if no link given
  category?: string;           // Electronics | Fashion | Home & Kitchen | ...
  priceMin?: number;           // user's min price (INR)
  priceMax?: number;           // user's max price (INR)
  platformPref?: PlatformPref; // amazon | flipkart | both

  // Resolved products (post-scraper)
  products: ProductSnapshot[];
  cacheHits: number;
  cacheMisses: number;

  // Clustered aspects per product (key = product index)
  clustersByProduct: AspectCluster[][];

  // Aggregated comparison table
  aggregatedTable: AggregatedTable | null;

  // Synthesized insight
  insight: InsightDTO | null;

  // Cost / latency telemetry
  nodeLogs: NodeLogDTO[];
  errorMessage?: string;

  // Bookkeeping
  startedAt: number;
}
