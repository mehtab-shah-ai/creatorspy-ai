import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { db } from "../db";

/**
 * Node 10 — Cost / Latency Logger.
 * Writes every node's actual cost (token usage × rate, API call cost) and
 * latency to SQLite, tagged to this run_id.
 *
 * Also updates the AnalysisRun row with totals.
 */
export async function costLoggerNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "costLogger", async (s) => {
    const runId = s.runId;
    const totalCost = s.nodeLogs.reduce((sum, n) => sum + (n.cost ?? 0), 0);
    const totalLatencyMs = Date.now() - s.startedAt;

    // Persist node logs to DB
    for (const log of s.nodeLogs) {
      await db.nodeLog.create({
        data: {
          runId,
          nodeName: log.nodeName,
          cost: log.cost,
          latencyMs: log.latencyMs,
          status: log.status,
          errorMessage: log.errorMessage,
          metadataJson: log.metadata ? JSON.stringify(log.metadata) : null,
          completedAt: new Date(),
        },
      });
    }

    // Persist products + clusters + flags + insight to DB
    if (s.products.length > 0) {
      // Find or create products
      for (let i = 0; i < s.products.length; i++) {
        const p = s.products[i]!;
        const role = i === 0 ? "your_product" : "competitor";
        const cacheKey = p.asin ?? p.url ?? `product-${i}`;

        const dbProduct = await db.product.create({
          data: {
            runId,
            sourceUrl: p.url,
            platform: p.platform,
            role,
            name: p.name,
            asin: p.asin,
            price: p.price,
            currency: p.currency,
            rating: p.rating,
            reviewCount: p.reviewCount,
            rawDataJson: JSON.stringify(p),
            cachedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
            dataQuality: p.dataQuality,
            errorMessage: p.errorMessage,
          },
        });

        // Persist clusters for this product
        const clusters = s.clustersByProduct[i] ?? [];
        for (const c of clusters) {
          await db.reviewCluster.create({
            data: {
              productId: dbProduct.id,
              aspect: c.aspect,
              sentiment: c.sentiment,
              frequency: c.frequency,
              exampleQuotesJson: JSON.stringify(c.exampleQuotes),
              confidence: c.confidence,
              sourceBreakdownJson: JSON.stringify(c.sourceBreakdown),
            },
          });
        }
      }
    }

    // Persist cross-source flags
    if (s.aggregatedTable) {
      for (const f of s.aggregatedTable.crossSourceFlags) {
        await db.crossSourceFlag.create({
          data: {
            runId,
            aspect: f.aspect,
            marketplaceSentiment: f.marketplaceSentiment,
            organicSentiment: f.organicSentiment,
            disagreementNote: f.disagreementNote,
            severity: f.severity,
          },
        });
      }
    }

    // Persist insight
    if (s.insight) {
      await db.insight.create({
        data: {
          runId,
          verdictText: s.insight.verdictText,
          confidence: s.insight.confidence,
          opportunitiesJson: JSON.stringify(s.insight.opportunities),
        },
      });
    }

    // Update AnalysisRun totals + status
    await db.analysisRun.update({
      where: { id: runId },
      data: {
        status: "completed",
        totalCost,
        totalLatencyMs,
        completedAt: new Date(),
        progress: 1.0,
        current_node: "costLogger",
      },
    });

    return {
      result: {},
      cost: 0,
      metadata: {
        totalCost,
        totalLatencyMs,
        nodeCount: s.nodeLogs.length,
        cacheHits: s.cacheHits,
        cacheMisses: s.cacheMisses,
      },
    };
  });
}
