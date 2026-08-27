import { StateGraph, START, END } from "@langchain/langgraph";
import { StateGraphAnnotation, fromAgentState, type GraphState } from "./state";
import { inputValidatorNode } from "../agents/input-validator";
import { competitorResolverNode } from "../agents/competitor-resolver";
import { scraperNode } from "../agents/scraper";
import { clusteringAndLabelingNode } from "../agents/clustering-labeling";
import { aggregationNode } from "../agents/aggregation";
import { crossSourceVerificationNode } from "../agents/cross-source-verification";
import { insightSynthesisNode } from "../agents/insight-synthesis";
import { selfVerificationNode } from "../agents/self-verification";
import { costLoggerNode } from "../agents/cost-logger";
import { db } from "../db";
import type { AgentState } from "../types";

/**
 * LangGraph state machine — the explicit graph that orchestrates the
 * multi-agent pipeline.
 *
 *   START → inputValidator → competitorResolver → scraper →
 *     clusteringAndLabeling → aggregation → crossSourceVerification →
 *     insightSynthesis → selfVerification → costLogger → END
 *
 * The graph is straight-line (no conditional edges) because the user spec
 * lists a fixed sequential flow. Internal node bodies still do parallel
 * fan-out where appropriate (e.g. scraper fans out per product).
 */
const workflow = new StateGraph(StateGraphAnnotation)
  .addNode("inputValidator", inputValidatorNode)
  .addNode("competitorResolver", competitorResolverNode)
  .addNode("scraper", scraperNode)
  .addNode("clustering", async (state: GraphState) => {
    // clusteringAndLabeling logs both "clustering" and "aspectLabeling" nodes internally
    return clusteringAndLabelingNode(state);
  })
  .addNode("aggregation", aggregationNode)
  .addNode("crossSourceVerification", crossSourceVerificationNode)
  .addNode("insightSynthesis", insightSynthesisNode)
  .addNode("selfVerification", selfVerificationNode)
  .addNode("costLogger", costLoggerNode)
  .addEdge(START, "inputValidator")
  .addEdge("inputValidator", "competitorResolver")
  .addEdge("competitorResolver", "scraper")
  .addEdge("scraper", "clustering")
  .addEdge("clustering", "aggregation")
  .addEdge("aggregation", "crossSourceVerification")
  .addEdge("crossSourceVerification", "insightSynthesis")
  .addEdge("insightSynthesis", "selfVerification")
  .addEdge("selfVerification", "costLogger")
  .addEdge("costLogger", END);

export const app = workflow.compile();

/**
 * Run the full graph for one analysis run.
 * Called by /api/analysis/start in a fire-and-forget manner.
 */
export async function runAnalysisGraph(input: AgentState): Promise<void> {
  const initialState = fromAgentState(input);
  const runId = input.runId;

  // Update run status to "running"
  await db.analysisRun.update({
    where: { id: runId },
    data: { status: "running", current_node: "inputValidator" },
  });

  try {
    // Stream the graph so we can observe progress
    // (We use invoke for simplicity here; in production we'd use streamEvents
    //  to push live updates via SSE.)
    const finalState = await app.invoke(initialState, {
      recursionLimit: 50,
    });

    // The costLogger node already persisted everything to DB + marked run as completed.
    // If somehow it didn't (e.g. error before costLogger), mark as completed with what we have.
    const run = await db.analysisRun.findUnique({ where: { id: runId } });
    if (run && run.status === "running") {
      await db.analysisRun.update({
        where: { id: runId },
        data: {
          status: "completed",
          totalCost: (finalState as GraphState).nodeLogs?.reduce((s, n) => s + (n.cost ?? 0), 0) ?? 0,
          totalLatencyMs: Date.now() - initialState.startedAt,
          completedAt: new Date(),
          progress: 1.0,
        },
      });
    }
  } catch (e: any) {
    console.error(`[graph] Run ${runId} failed:`, e);
    await db.analysisRun.update({
      where: { id: runId },
      data: {
        status: "failed",
        errorMessage: e?.message ?? String(e),
        completedAt: new Date(),
      },
    });
  }
}
