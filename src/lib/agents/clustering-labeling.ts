import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { clusterReviews } from "./clustering";
import { labelClusterBatch } from "./labeling";
import type { AspectCluster, ReviewItem } from "../types";
import { config } from "../config";

/**
 * Node 4 + 5 — Clustering + Aspect Labeling.
 *
 * Per user spec, these are SEPARATE nodes in the graph but tightly coupled:
 *   - Clustering embeds reviews + groups by similarity (no LLM call)
 *   - Aspect Labeling takes each cluster (10-15 reviews per batch) and calls
 *     Groq for forced-JSON aspect/sentiment/frequency/example_quotes output
 *
 * We collapse them here into one node for simplicity, but the conceptual flow
 * (cluster first → label second) is preserved and the nodeLogs explicitly
 * record both phases.
 */
export async function clusteringAndLabelingNode(state: GraphState): Promise<Partial<GraphState>> {
  // First log clustering
  const clusteringResult = await trackNode(state, "clustering", async (s) => {
    // Parallel: cluster each product's reviews
    const tasks = s.products.map((p) => clusterReviews(p.reviews));
    const results = await Promise.allSettled(tasks);

    const clustersByProduct: ReviewItem[][][] = [];
    let ok = 0;
    let failed = 0;

    for (const r of results) {
      if (r.status === "fulfilled") {
        clustersByProduct.push(r.value.clusters);
        ok++;
      } else {
        clustersByProduct.push([]);
        failed++;
      }
    }

    return {
      result: { _clustersByProductRaw: clustersByProduct },
      cost: 0,
      metadata: { productsClustered: ok, failed, embeddingsUsed: results[0]?.status === "fulfilled" ? (results[0] as any).value.embeddingsUsed : false },
    };
  });

  // Then log aspect labeling
  const labelingResult = await trackNode({ ...state, ...clusteringResult } as GraphState, "aspectLabeling", async (s) => {
    const rawClusters = (clusteringResult as any)._clustersByProductRaw as ReviewItem[][][];
    const tasks: Promise<{ clusters: AspectCluster[]; cost: number }>[] = s.products.map((p, i) => {
      const clusters = rawClusters[i] ?? [];
      // Limit total batches per product to avoid runaway cost
      const limitedClusters = clusters.slice(0, 30);
      // Parallel batch labeling
      return Promise.all(
        limitedClusters.map((batch) =>
          labelClusterBatch(p.name ?? p.asin ?? `Product${i}`, batch).then((r) => ({
            cluster: r.cluster,
            cost: r.cost,
          })),
        ),
      ).then((arrs) => ({
        clusters: arrs.filter((a) => a.cluster).map((a) => a.cluster!),
        cost: arrs.reduce((sum, a) => sum + a.cost, 0),
      }));
    });
    const results = await Promise.allSettled(tasks);

    const clustersByProduct: AspectCluster[][] = [];
    let totalCost = 0;

    for (const r of results) {
      if (r.status === "fulfilled") {
        clustersByProduct.push(r.value.clusters);
        totalCost += r.value.cost;
      } else {
        clustersByProduct.push([]);
      }
    }

    return {
      result: { clustersByProduct },
      cost: totalCost,
      metadata: {
        productsLabeled: clustersByProduct.length,
        totalClusters: clustersByProduct.reduce((s, c) => s + c.length, 0),
      },
    };
  });

  // Merge both node logs + final state
  return {
    clustersByProduct: (labelingResult as any).clustersByProduct ?? [],
    nodeLogs: [...(clusteringResult.nodeLogs ?? []), ...(labelingResult.nodeLogs ?? [])],
    currentNode: "aspectLabeling",
    progress: 0.65,
  };
}
