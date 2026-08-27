import type { GraphState } from "../graph/state";
import type { NodeLogDTO } from "../types";

/**
 * Tiny logger that wraps a node execution with cost + latency tracking.
 * Returnsed metadata is added to nodeLogs so the dashboard can show per-node breakdown.
 */
export async function trackNode<T>(
  state: GraphState,
  nodeName: string,
  fn: (state: GraphState) => Promise<{ result: Partial<GraphState>; cost: number; metadata?: Record<string, unknown> }>,
): Promise<Partial<GraphState>> {
  const startedAt = Date.now();
  const startedAtDate = new Date(startedAt);
  console.log(`[graph] ▶ ${nodeName} starting`);
  let status: NodeLogDTO["status"] = "ok";
  let errorMessage: string | undefined;
  let cost = 0;
  let metadata: Record<string, unknown> | undefined;
  let patch: Partial<GraphState> = {};

  try {
    const out = await fn(state);
    cost = out.cost;
    metadata = out.metadata;
    patch = out.result;
  } catch (e: any) {
    status = "error";
    errorMessage = e?.message ?? String(e);
    console.error(`[graph] ✗ ${nodeName} failed: ${errorMessage}`);
  }

  const latencyMs = Date.now() - startedAt;
  const log: NodeLogDTO = {
    nodeName,
    cost,
    latencyMs,
    status,
    errorMessage,
    metadata,
  };

  console.log(`[graph] ✓ ${nodeName} done in ${latencyMs}ms, cost=$${cost.toFixed(6)}`);

  return {
    ...patch,
    nodeLogs: [log],
    currentNode: nodeName,
    // Map each node to a progress fraction (0..1) — sum of all node weights = 1.0
    progress: PROGRESS_BY_NODE[nodeName] ?? state.progress ?? 0,
  };
}

// Sum of weights = 1.0
const PROGRESS_BY_NODE: Record<string, number> = {
  inputValidator: 0.04,
  competitorResolver: 0.08,
  competitorVerifier: 0.15,
  scraper: 0.40,
  clustering: 0.55,
  aspectLabeling: 0.68,
  aggregation: 0.78,
  crossSourceVerification: 0.85,
  insightSynthesis: 0.93,
  selfVerification: 0.98,
  costLogger: 1.0,
};

export const NODE_ORDER = [
  "inputValidator",
  "competitorResolver",
  "competitorVerifier",
  "scraper",
  "clustering",
  "aspectLabeling",
  "aggregation",
  "crossSourceVerification",
  "insightSynthesis",
  "selfVerification",
  "costLogger",
] as const;
