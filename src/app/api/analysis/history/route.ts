import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runs = await db.analysisRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        current_node: true,
        progress: true,
        yourProductInput: true,
        totalCost: true,
        totalLatencyMs: true,
        createdAt: true,
        completedAt: true,
        errorMessage: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({
      runs: runs.map((r) => ({
        runId: r.id,
        status: r.status,
        currentNode: r.current_node,
        progress: r.progress,
        yourProductInput: r.yourProductInput,
        totalCost: r.totalCost,
        totalLatencyMs: r.totalLatencyMs,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        errorMessage: r.errorMessage,
        productCount: r._count.products,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
