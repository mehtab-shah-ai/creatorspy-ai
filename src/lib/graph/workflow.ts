import { StateGraph, START, END } from "@langchain/langgraph";
import { StateGraphAnnotation, fromAgentState, type GraphState } from "./state";
import { inputValidatorNode } from "../agents/input-validator";
import { competitorResolverNode } from "../agents/competitor-resolver";
import { competitorVerifierNode } from "../agents/competitor-verifier";
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
 *   START → inputValidator → competitorResolver → competitorVerifier →
 *     scraper → clustering → aggregation → crossSourceVerification →
 *     insightSynthesis → selfVerification → costLogger → END
 *
 * FIX 3: competitorVerifier is a NEW node between resolver and scraper.
 *        If it sets verificationMessage (no comparable competitor found),
 *        the graph short-circuits to costLogger to avoid wasting Apify credits.
 */
const workflow = new StateGraph(StateGraphAnnotation)
  .addNode("inputValidator", inputValidatorNode)
  .addNode("competitorResolver", competitorResolverNode)
  .addNode("competitorVerifier", competitorVerifierNode)
  .addNode("scraper", scraperNode)
  .addNode("clustering", async (state: GraphState) => {
    return clusteringAndLabelingNode(state);
  })
  .addNode("aggregation", aggregationNode)
  .addNode("crossSourceVerification", crossSourceVerificationNode)
  .addNode("insightSynthesis", insightSynthesisNode)
  .addNode("selfVerification", selfVerificationNode)
  .addNode("costLogger", costLoggerNode)
  .addEdge(START, "inputValidator")
  .addEdge("inputValidator", "competitorResolver")
  .addEdge("competitorResolver", "competitorVerifier")
  // Conditional: if verifier found comparable competitors → scraper, else → costLogger
  .addConditionalEdges(
    "competitorVerifier",
    (state: GraphState) => {
      if (state.verificationMessage) {
        console.log(`[graph] Short-circuiting to costLogger — no comparable competitor found: ${state.verificationMessage}`);
        return "costLogger";
      }
      return "scraper";
    },
    { scraper: "scraper", costLogger: "costLogger" },
  )
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
    const finalState = await app.invoke(initialState, {
      recursionLimit: 50,
    }) as GraphState;

    // If verification failed, surface the message on the run row.
    if (finalState.verificationMessage) {
      await db.analysisRun.update({
        where: { id: runId },
        data: {
          status: "completed",
          errorMessage: finalState.verificationMessage,
          totalCost: finalState.nodeLogs?.reduce((s, n) => s + (n.cost ?? 0), 0) ?? 0,
          totalLatencyMs: Date.now() - initialState.startedAt,
          completedAt: new Date(),
          progress: 1.0,
          current_node: "costLogger",
        },
      });
      return;
    }

    // The costLogger node already persisted everything + marked run as completed.
    // If somehow it didn't (e.g. error before costLogger), mark as completed here.
    const run = await db.analysisRun.findUnique({ where: { id: runId } });
    if (run && run.status === "running") {
      await db.analysisRun.update({
        where: { id: runId },
        data: {
          status: "completed",
          totalCost: finalState.nodeLogs?.reduce((s, n) => s + (n.cost ?? 0), 0) ?? 0,
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
