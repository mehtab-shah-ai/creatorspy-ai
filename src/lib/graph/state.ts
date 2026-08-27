import { Annotation } from "@langchain/langgraph";
import type {
  AspectCluster,
  AggregatedTable,
  InsightDTO,
  NodeLogDTO,
  ProductSnapshot,
  AgentState,
} from "../types";

/**
 * LangGraph state annotation. We use Annotation.Root to define the
 * accumulating state that flows through every node.
 */
export const StateGraphAnnotation = Annotation.Root({
  runId: Annotation<string>,
  userId: Annotation<string>,
  yourProductInput: Annotation<string>,
  competitorInputs: Annotation<string[]>,
  autoFind: Annotation<boolean>,

  // Validator output
  validatedProducts: Annotation<
    { input: string; role: "your_product" | "competitor"; asin?: string; url?: string; name?: string; platform: string }[]
  >({
    reducer: (_, v) => v,
    default: () => [],
  }),

  products: Annotation<ProductSnapshot[]>({
    reducer: (_, v) => v,
    default: () => [],
  }),
  cacheHits: Annotation<number>({
    reducer: (a, b) => a + b,
    default: () => 0,
  }),
  cacheMisses: Annotation<number>({
    reducer: (a, b) => a + b,
    default: () => 0,
  }),

  clustersByProduct: Annotation<AspectCluster[][]>({
    reducer: (_, v) => v,
    default: () => [],
  }),

  aggregatedTable: Annotation<AggregatedTable | null>({
    reducer: (_, v) => v,
    default: () => null,
  }),

  insight: Annotation<InsightDTO | null>({
    reducer: (_, v) => v,
    default: () => null,
  }),

  nodeLogs: Annotation<NodeLogDTO[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),

  errorMessage: Annotation<string | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),

  startedAt: Annotation<number>({
    reducer: (_, v) => v,
    default: () => Date.now(),
  }),

  currentNode: Annotation<string | null>({
    reducer: (_, v) => v,
    default: () => null,
  }),
  progress: Annotation<number>({
    reducer: (_, v) => v,
    default: () => 0,
  }),
});

export type GraphState = typeof StateGraphAnnotation.State;

// Helper to coerce a partial AgentState into the Annotation state shape
export function fromAgentState(s: AgentState): GraphState {
  return {
    runId: s.runId,
    userId: s.userId,
    yourProductInput: s.yourProductInput,
    competitorInputs: s.competitorInputs,
    autoFind: s.autoFind,
    validatedProducts: [],
    products: [],
    cacheHits: 0,
    cacheMisses: 0,
    clustersByProduct: [],
    aggregatedTable: null,
    insight: null,
    nodeLogs: [],
    errorMessage: undefined,
    startedAt: Date.now(),
    currentNode: null,
    progress: 0,
  };
}
