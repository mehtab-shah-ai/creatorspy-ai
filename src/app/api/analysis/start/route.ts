import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { z } from "zod";

// Lazy-load the graph so Turbopack can code-split it (reduces memory pressure
// during dev compile — the full workflow + all agents/services only load when
// an analysis actually starts, not when the route module is first imported).
async function runAnalysisGraph(input: any): Promise<void> {
  const { runAnalysisGraph: fn } = await import("@/lib/graph/workflow");
  return fn(input);
}

// FIX 1: expanded form schema with all 6 fields
const schema = z.object({
  // 1. Product link (optional Amazon.in or Flipkart.com URL)
  productLink: z.string().url().optional().or(z.literal("").transform(() => undefined)),

  // 2. Product name / short description (required if no link)
  productName: z.string().min(3).optional(),

  // 3. Category (required)
  category: z.enum([
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty",
    "Sports",
    "Books",
    "Toys",
    "Grocery",
    "Other",
  ]),

  // 4. Price range (required, in INR)
  priceMin: z.number().min(0),
  priceMax: z.number().min(1),

  // 5. Platform preference (required, default both)
  platform: z.enum(["amazon", "flipkart", "both"]).default("both"),

  // 6. Competitors (optional list of links)
  competitors: z.array(z.string()).max(3).default([]),

  // Auto-find toggle (if true, ignore competitors[] and use fields 2-5 to search)
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

export async function POST(req: NextRequest) {
  try {
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
      productLink,
      productName,
      category,
      priceMin,
      priceMax,
      platform,
      competitors,
      autoFind,
    } = parsed.data;

    // If link is given, derive yourProductInput from it (skip search for YOUR product)
    const yourProductInput = productLink ?? productName!;

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

    // Kick off the graph async (fire-and-forget)
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
