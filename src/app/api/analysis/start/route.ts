import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// CRITICAL: Do NOT import the workflow, db, or auth at module level.
// This route is hit by the user's browser. If we import the heavy LangGraph
// workflow at module level, Turbopack tries to compile ALL agents + services
// the moment this route is first accessed — which OOMs the 4GB dev sandbox.
//
// Instead, we lazy-load EVERYTHING (db, auth, workflow) inside the handler
// using dynamic import(). This way the route module itself is tiny and compiles
// instantly. The heavy modules only load when an actual request comes in,
// and by that point the HTTP response can return before the graph kicks off.

// FIX 1: expanded form schema with all 6 fields
const schema = z.object({
  productLink: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  productName: z.string().min(3).optional(),
  category: z.enum([
    "Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports",
    "Books", "Toys", "Grocery", "Other",
  ]),
  priceMin: z.number().min(0),
  priceMax: z.number().min(1),
  platform: z.enum(["amazon", "flipkart", "both"]).default("both"),
  competitors: z.array(z.string()).max(3).default([]),
  autoFind: z.boolean().default(false),
}).refine(
  (data) => data.priceMax > data.priceMin,
  { message: "Max price must be greater than min price" },
).refine(
  (data) => data.productLink || data.productName,
  { message: "Either product link or product name is required", path: ["productName"] },
).refine(
  (data) => data.autoFind || data.competitors.length > 0,
  { message: "Either provide competitor links or enable auto-find", path: ["competitors"] },
);

// Prevent Next.js from trying to statically optimize this route.
export const dynamic = "force-dynamic";
// Don't cache the response.
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // Lazy-load auth (lightweight — just db + bcrypt + jose)
    const { getUserFromRequest } = await import("@/lib/auth");
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const {
      productLink, productName, category, priceMin, priceMax,
      platform, competitors, autoFind,
    } = parsed.data;

    const yourProductInput = productLink ?? productName!;

    // Lazy-load db (Prisma client)
    const { db } = await import("@/lib/db");
    const { isDemoMode } = await import("@/lib/config");

    // Create the AnalysisRun row immediately so we can return run_id
    const run = await db.analysisRun.create({
      data: {
        userId: user.id,
        status: "pending",
        yourProductInput,
        competitorInputs: JSON.stringify(competitors),
        autoFind,
        productLink: productLink ?? null,
        productName: productName ?? null,
        category,
        priceMin,
        priceMax,
        platformPref: platform,
        progress: 0,
        current_node: "inputValidator",
      },
    });

    const agentInput = {
      runId: run.id,
      userId: user.id,
      yourProductInput,
      competitorInputs: competitors,
      autoFind,
      productLink,
      productName,
      category,
      priceMin,
      priceMax,
      platformPref: platform,
      products: [],
      cacheHits: 0,
      cacheMisses: 0,
      clustersByProduct: [],
      aggregatedTable: null,
      insight: null,
      nodeLogs: [],
      startedAt: Date.now(),
    };

    // Defer the heavy graph import + execution to the next event-loop tick.
    // This ensures the HTTP response is sent FIRST (the user sees the runId
    // immediately), and the LangGraph workflow compiles + runs in the
    // background without blocking the response.
    //
    // We use setTimeout(0) instead of setImmediate because Next.js
    // bundles setImmediate differently in dev mode.
    setTimeout(() => {
      import("@/lib/graph/workflow")
        .then(({ runAnalysisGraph }) => runAnalysisGraph(agentInput))
        .catch((e) => {
          console.error(`[analysis/start] Background graph failed:`, e);
        });
    }, 0);

    return NextResponse.json({
      runId: run.id,
      status: "pending",
      demoMode: isDemoMode(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to start analysis" }, { status: 500 });
  }
}
