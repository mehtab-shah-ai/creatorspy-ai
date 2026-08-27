import { Annotation } from "@langchain/langgraph";
import type {
  AspectCluster,
  AggregatedTable,
  InsightDTO,
  NodeLogDTO,
  ProductSnapshot,
  AgentState,
  PlatformPref,
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

  // FIX 1: structured form fields
  productLink: Annotation<string | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),
  productName: Annotation<string | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),
  category: Annotation<string | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),
  priceMin: Annotation<number | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),
  priceMax: Annotation<number | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),
  platformPref: Annotation<PlatformPref | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
  }),

  // Validator output
  validatedProducts: Annotation<
    { input: string; role: "your_product" | "competitor"; asin?: string; url?: string; name?: string; platform: string; expectedPrice?: number; expectedCurrency?: string }[]
  >({
    reducer: (_, v) => v,
    default: () => [],
  }),

  // FIX 3: candidates awaiting verification (output of competitorResolver, input to competitorVerifier)
  candidateCompetitors: Annotation<
    { title: string; link: string; source: string; price?: number; currency?: string; imageUrl?: string; rating?: number; ratingCount?: number }[]
  >({
    reducer: (_, v) => v,
    default: () => [],
  }),

  // FIX 3: when verification fails to find ANY comparable competitor, set this to surface to the user
  verificationMessage: Annotation<string | undefined>({
    reducer: (_, v) => v,
    default: () => undefined,
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
    productLink: s.productLink,
    productName: s.productName,
    category: s.category,
    priceMin: s.priceMin,
    priceMax: s.priceMax,
    platformPref: s.platformPref,
    validatedProducts: [],
    candidateCompetitors: [],
    verificationMessage: undefined,
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
