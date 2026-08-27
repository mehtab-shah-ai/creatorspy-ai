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
        status: true,
        current_node: true,
        progress: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    // Fetch recent node logs to show "which node is running"
    const nodeLogs = await db.nodeLog.findMany({
      where: { runId },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { nodeName: true, status: true, latencyMs: true },
    });

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      currentNode: run.current_node,
      progress: run.progress,
      errorMessage: run.errorMessage,
      startedAt: run.createdAt,
      completedAt: run.completedAt,
      recentNodes: nodeLogs,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
