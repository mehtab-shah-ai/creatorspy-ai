import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { runAnalysisGraph } from "@/lib/graph/workflow";
import { isDemoMode } from "@/lib/config";
import { z } from "zod";

const schema = z.object({
  yourProduct: z.string().min(3),
  competitors: z.array(z.string()).max(3).default([]),
  autoFind: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { yourProduct, competitors, autoFind } = parsed.data;

    // Validate input shape before any paid API calls (per spec, worst-case 4)
    if (!autoFind && competitors.length === 0) {
      return NextResponse.json(
        { error: "Either provide competitor links or enable auto-find" },
        { status: 400 },
      );
    }

    // Create the AnalysisRun row immediately so we can return run_id
    const run = await db.analysisRun.create({
      data: {
        userId: user.id,
        status: "pending",
        yourProductInput: yourProduct,
        competitorInputs: JSON.stringify(competitors),
        autoFind,
        progress: 0,
        current_node: "inputValidator",
      },
    });

    // Kick off the graph async (fire-and-forget)
    // We use setImmediate to ensure the response returns first.
    const agentInput = {
      runId: run.id,
      userId: user.id,
      yourProductInput: yourProduct,
      competitorInputs: competitors,
      autoFind,
      products: [],
      cacheHits: 0,
      cacheMisses: 0,
      clustersByProduct: [],
      aggregatedTable: null,
      insight: null,
      nodeLogs: [],
      startedAt: Date.now(),
    };

    // Run in background — don't await
    runAnalysisGraph(agentInput).catch((e) => {
      console.error(`[analysis/start] Background graph failed:`, e);
    });

    return NextResponse.json({
      runId: run.id,
      status: "pending",
      demoMode: isDemoMode(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to start analysis" }, { status: 500 });
  }
}
