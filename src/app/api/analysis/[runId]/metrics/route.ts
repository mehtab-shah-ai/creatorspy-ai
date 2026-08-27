import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

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
      select: {
        id: true,
        totalCost: true,
        totalLatencyMs: true,
        nodeLogs: { orderBy: { startedAt: "asc" } },
      },
    });

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const scraperLog = run.nodeLogs.find((n) => n.nodeName === "scraper");
    const cacheHits = scraperLog?.metadataJson
      ? (JSON.parse(scraperLog.metadataJson).cacheHits ?? 0)
      : 0;
    const cacheMisses = scraperLog?.metadataJson
      ? (JSON.parse(scraperLog.metadataJson).cacheMisses ?? 0)
      : 0;

    return NextResponse.json({
      totalCost: run.totalCost,
      totalLatencyMs: run.totalLatencyMs,
      nodeLogs: run.nodeLogs.map((n) => ({
        nodeName: n.nodeName,
        cost: n.cost,
        latencyMs: n.latencyMs,
        status: n.status,
        errorMessage: n.errorMessage ?? undefined,
        metadata: n.metadataJson ? JSON.parse(n.metadataJson) : undefined,
      })),
      cacheHits,
      cacheMisses,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
