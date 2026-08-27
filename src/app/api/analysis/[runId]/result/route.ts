import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import type { AnalysisResultDTO, AspectCluster, CrossSourceFlagDTO, InsightDTO, InsightOpportunity, ProductAspectSummary, AggregatedTable } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { runId } = await params;
    const run = await db.analysisRun.findFirst({
      where: { id: runId, userId: user.id },
      include: {
        products: {
          include: { reviewClusters: true },
        },
        crossSourceFlags: true,
        insights: { orderBy: { generatedAt: "desc" }, take: 1 },
        nodeLogs: { orderBy: { startedAt: "asc" } },
      },
    });

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    if (run.status !== "completed") {
      return NextResponse.json({
        runId,
        status: run.status,
        message: "Run not yet complete",
        progress: run.progress,
        currentNode: run.current_node,
      });
    }

    // Re-hydrate ProductAspectSummary from DB
    const productSummaries: ProductAspectSummary[] = run.products.map((p) => {
      const aspects: AspectCluster[] = p.reviewClusters.map((c) => ({
        aspect: c.aspect,
        sentiment: c.sentiment as any,
        frequency: c.frequency,
        exampleQuotes: JSON.parse(c.exampleQuotesJson || "[]"),
        confidence: c.confidence,
        sourceBreakdown: JSON.parse(c.sourceBreakdownJson || '{"marketplace":0,"reddit":0,"blog":0}'),
      }));

      return {
        productId: p.asin ?? p.id,
        productName: p.name ?? "Unknown",
        sourceUrl: p.sourceUrl ?? undefined,
        role: p.role as "your_product" | "competitor",
        price: p.price ?? undefined,
        currency: p.currency ?? "USD",
        rating: p.rating ?? undefined,
        reviewCount: p.reviewCount,
        dataQuality: p.dataQuality as any,
        aspects,
        topComplaints: aspects.filter((a) => a.sentiment === "negative" || a.sentiment === "mixed").sort((a, b) => b.frequency - a.frequency).slice(0, 5),
        topPraises: aspects.filter((a) => a.sentiment === "positive").sort((a, b) => b.frequency - a.frequency).slice(0, 5),
      };
    });

    const yourProduct = productSummaries[0]!;
    const competitors = productSummaries.slice(1);

    const aspectSet = new Set<string>();
    for (const p of productSummaries) for (const a of p.aspects) aspectSet.add(a.aspect);

    const crossSourceFlags: CrossSourceFlagDTO[] = run.crossSourceFlags.map((f) => ({
      aspect: f.aspect,
      marketplaceSentiment: f.marketplaceSentiment as any,
      organicSentiment: f.organicSentiment as any,
      disagreementNote: f.disagreementNote,
      severity: f.severity as any,
    }));

    const aggregatedTable: AggregatedTable = {
      products: productSummaries,
      aspects: Array.from(aspectSet).sort(),
      crossSourceFlags,
    };

    const dbInsight = run.insights[0];
    let insight: InsightDTO | null = null;
    if (dbInsight) {
      const opportunities: InsightOpportunity[] = JSON.parse(dbInsight.opportunitiesJson || "[]");
      insight = {
        verdictText: dbInsight.verdictText,
        confidence: dbInsight.confidence,
        opportunities,
        verifiedClaims: [],
      };
    }

    const metrics = {
      totalCost: run.totalCost,
      totalLatencyMs: run.totalLatencyMs,
      nodeLogs: run.nodeLogs.map((n) => ({
        nodeName: n.nodeName,
        cost: n.cost,
        latencyMs: n.latencyMs,
        status: n.status as any,
        errorMessage: n.errorMessage ?? undefined,
        metadata: n.metadataJson ? JSON.parse(n.metadataJson) : undefined,
      })),
      cacheHits: run.nodeLogs.find((n) => n.nodeName === "scraper")?.metadataJson
        ? (JSON.parse(run.nodeLogs.find((n) => n.nodeName === "scraper")!.metadataJson!).cacheHits ?? 0)
        : 0,
      cacheMisses: run.nodeLogs.find((n) => n.nodeName === "scraper")?.metadataJson
        ? (JSON.parse(run.nodeLogs.find((n) => n.nodeName === "scraper")!.metadataJson!).cacheMisses ?? 0)
        : 0,
    };

    const result: AnalysisResultDTO = {
      runId,
      status: run.status as any,
      yourProduct,
      competitors,
      aggregatedTable,
      insight,
      metrics,
      dataQuality: yourProduct.dataQuality,
      demoMode: isDemoMode(),
    };

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
