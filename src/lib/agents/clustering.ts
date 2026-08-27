import { isServiceAvailable, config } from "../config";
import { withRetry, withTimeout } from "../retry";
import type { ReviewItem, AspectCluster } from "../types";

/**
 * Embeddings + clustering node.
 *
 * Per user spec:
 *   - Use a free HF embedding model (sentence-transformers/all-MiniLM-L6-v2)
 *   - Cluster by semantic similarity (NO LLM call yet — pure embeddings + clustering)
 *   - If clustering produces only 1 giant cluster, skip clustering and process
 *     as a single small batch instead of forcing artificial splits
 */

const HF_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction";

export interface ClusterResult {
  clusters: ReviewItem[][];
  embeddingsUsed: boolean;
  demoMode: boolean;
  cost: number;
}

export async function embedReviews(texts: string[]): Promise<{
  embeddings: number[][];
  demoMode: boolean;
}> {
  if (!isServiceAvailable("HF") || texts.length === 0) {
    return { embeddings: mockEmbed(texts), demoMode: true };
  }

  const res = await withRetry(
    () =>
      withTimeout(
        fetch(`${HF_URL}/${config.hfEmbeddingModel}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
        }).then(async (r) => {
          if (!r.ok) {
            const e: any = new Error(`HF ${r.status}`);
            e.status = r.status;
            throw e;
          }
          return r.json();
        }),
        30_000,
        "hf-embed",
      ),
    { label: "hf-embed" },
  );

  if (!res.ok) return { embeddings: mockEmbed(texts), demoMode: true };

  return { embeddings: res.value as number[][], demoMode: false };
}

export async function clusterReviews(reviews: ReviewItem[]): Promise<ClusterResult> {
  if (reviews.length === 0) {
    return { clusters: [], embeddingsUsed: false, demoMode: false, cost: 0 };
  }

  // Per spec: batches of 10-15 reviews per LLM call.
  // Cluster size target: ~10-15 reviews per cluster.
  const TARGET_CLUSTER_SIZE = 12;
  const MIN_CLUSTERS = 3;

  const texts = reviews.map((r) => `${r.title ?? ""} ${r.body}`.trim());
  const { embeddings, demoMode } = await embedReviews(texts);

  // Compute pairwise cosine similarity
  const clusters: number[][] = []; // each cluster = indices into reviews
  const used = new Set<number>();

  // Greedy agglomerative clustering: pick seed, find all reviews with sim > 0.6, group them
  for (let i = 0; i < reviews.length; i++) {
    if (used.has(i)) continue;
    const cluster = [i];
    used.add(i);
    for (let j = i + 1; j < reviews.length; j++) {
      if (used.has(j)) continue;
      const sim = cosineSim(embeddings[i]!, embeddings[j]!);
      if (sim > 0.6 && cluster.length < TARGET_CLUSTER_SIZE) {
        cluster.push(j);
        used.add(j);
      }
    }
    clusters.push(cluster);
  }

  // Worst-case 6: only 1 giant cluster → split into batches instead of forcing
  // artificial semantic splits, but at least produce MIN_CLUSTERS batches so the
  // labeling agent has multiple aspect outputs to aggregate.
  if (clusters.length < MIN_CLUSTERS && reviews.length > MIN_CLUSTERS * TARGET_CLUSTER_SIZE) {
    const flat: ReviewItem[][] = [];
    for (let i = 0; i < reviews.length; i += TARGET_CLUSTER_SIZE) {
      flat.push(reviews.slice(i, i + TARGET_CLUSTER_SIZE));
    }
    return {
      clusters: flat,
      embeddingsUsed: false,
      demoMode,
      cost: 0,
    };
  }

  // If we have 1 cluster only and very few reviews, just send as one batch
  if (clusters.length === 1) {
    return {
      clusters: [reviews],
      embeddingsUsed: false,
      demoMode,
      cost: 0,
    };
  }

  return {
    clusters: clusters.map((c) => c.map((i) => reviews[i]!)),
    embeddingsUsed: true,
    demoMode,
    cost: 0,
  };
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------- Demo embeddings (deterministic hashing → low-dim vector) ----------

function mockEmbed(texts: string[]): number[][] {
  return texts.map((t) => hashEmbed(t, 64));
}

function hashEmbed(text: string, dims: number): number[] {
  // Hash each word into one of `dims` buckets, accumulate TF-style signal.
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  for (const w of words) {
    let h = 0;
    for (let i = 0; i < w.length; i++) h = ((h << 5) - h + w.charCodeAt(i)) | 0;
    vec[Math.abs(h) % dims]! += 1;
  }
  // L2 normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) for (let i = 0; i < dims; i++) vec[i] = vec[i]! / mag;
  return vec;
}
