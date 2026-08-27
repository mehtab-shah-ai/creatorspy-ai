"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useUI } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { AnalysisResultDTO, NodeLogDTO, RunStatusDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Zap,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Star,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const NODE_FLOW = [
  "inputValidator",
  "competitorResolver",
  "scraper",
  "clustering",
  "aspectLabeling",
  "aggregation",
  "crossSourceVerification",
  "insightSynthesis",
  "selfVerification",
  "costLogger",
];

const NODE_LABELS: Record<string, string> = {
  inputValidator: "Validating input",
  competitorResolver: "Resolving competitors",
  scraper: "Fetching reviews & organic sentiment",
  clustering: "Embedding + clustering reviews",
  aspectLabeling: "Labeling aspects with Groq",
  aggregation: "Aggregating comparison table",
  crossSourceVerification: "Cross-verifying sources",
  insightSynthesis: "Synthesizing insight (Gemini)",
  selfVerification: "Self-verifying claims",
  costLogger: "Persisting to SQLite",
};

export function ResultsView() {
  const { token } = useAuth();
  const { activeRunId, goDashboard } = useUI();
  const { toast } = useToast();

  const [status, setStatus] = useState<RunStatusDTO | null>(null);
  const [result, setResult] = useState<AnalysisResultDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeRunId || !token) return;
    let cancelled = false;

    async function poll() {
      try {
        const s = await api.getStatus(activeRunId, token);
        if (cancelled) return;
        setStatus(s as any);
        if (s.status === "completed") {
          const r = await api.getResult(activeRunId, token);
          if (cancelled) return;
          setResult(r);
          setLoading(false);
          if (pollRef.current) clearTimeout(pollRef.current);
        } else if (s.status === "failed") {
          setLoading(false);
          if (pollRef.current) clearTimeout(pollRef.current);
        } else {
          // Continue polling
          pollRef.current = setTimeout(poll, 1500);
        }
      } catch (e: any) {
        if (!cancelled) {
          toast({ title: "Polling failed", description: e?.message, variant: "destructive" });
          setLoading(false);
        }
      }
    }
    poll();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeRunId, token, toast]);

  if (!activeRunId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ambient">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No active run.</p>
            <Button onClick={goDashboard}>Go to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = status?.status === "running" || status?.status === "pending";

  return (
    <div className="min-h-screen bg-ambient">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur sticky top-0 z-30">
        <div className="px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goDashboard}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="font-display font-semibold hidden md:block">
              {isRunning ? "Pipeline running" : "Analysis complete"}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-12 py-8 max-w-7xl mx-auto">
        {isRunning && (
          <ProgressTracker status={status!} />
        )}

        {!isRunning && status?.status === "failed" && (
          <Card className="border-destructive/40">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-3" />
              <h2 className="font-display text-xl font-semibold mb-2">Pipeline failed</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {status?.errorMessage ?? "Unknown error"}
              </p>
              <Button onClick={goDashboard}>Back to dashboard</Button>
            </CardContent>
          </Card>
        )}

        {!isRunning && result && (
          <ResultDisplay result={result} />
        )}
      </main>
    </div>
  );
}

// ---------- Progress tracker (live) ----------

function ProgressTracker({ status }: { status: RunStatusDTO }) {
  const currentNodeIdx = status.currentNode ? NODE_FLOW.indexOf(status.currentNode) : -1;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-2 rounded-full bg-accent pulse-amber" />
          <span className="text-accent text-sm font-medium uppercase tracking-wide">Live</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          {status.currentNode ? NODE_LABELS[status.currentNode] ?? status.currentNode : "Starting…"}
          <span className="inline-block w-1 h-7 bg-accent ml-1 animate-pulse align-middle" />
        </h1>
        <p className="text-muted-foreground mt-2">
          Node {Math.max(0, currentNodeIdx) + 1} of {NODE_FLOW.length} ·{" "}
          {Math.round((status.progress ?? 0) * 100)}% complete
        </p>
      </motion.div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(status.progress ?? 0) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Started {new Date(status.startedAt).toLocaleTimeString()}</span>
            <span>{Math.round((status.progress ?? 0) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Node timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
        {NODE_FLOW.map((node, idx) => {
          const done = idx < currentNodeIdx;
          const active = idx === currentNodeIdx;
          return (
            <motion.div
              key={node}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`h-full transition-all ${
                  active
                    ? "border-accent/50 bg-accent/5 glow-accent"
                    : done
                      ? "border-success/30 bg-success/5"
                      : "opacity-50"
                }`}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      active ? "bg-accent text-background" : done ? "bg-success text-background" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </div>
                    <span className="font-mono text-xs">{node}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {NODE_LABELS[node] ?? node}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent node activity */}
      {(status as any)?.recentNodes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              Node activity stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 font-mono text-xs">
              <AnimatePresence>
                {((status as any).recentNodes ?? []).slice(0, 10).map((n: any, i: number) => (
                  <motion.div
                    key={`${n.nodeName}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 py-1"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      n.status === "ok" ? "bg-success" :
                      n.status === "error" ? "bg-destructive" :
                      n.status === "partial" ? "bg-warning" : "bg-muted"
                    }`} />
                    <span className="text-foreground">{n.nodeName}</span>
                    <span className="text-muted-foreground">{n.status}</span>
                    <span className="ml-auto text-muted-foreground">{n.latencyMs}ms</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------- Result display ----------

function ResultDisplay({ result }: { result: AnalysisResultDTO }) {
  const { aggregatedTable, insight, metrics } = result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Demo mode banner */}
      {result.demoMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Demo mode active</p>
                <p className="text-xs text-muted-foreground">
                  Some API keys are missing. Pipeline executed end-to-end with synthetic review
                  data so you can see the full UX. Add real keys to .env to scrape live data.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-success text-sm font-medium uppercase tracking-wide">Complete</span>
          <Badge variant="outline" className="ml-2">{result.dataQuality} data</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Comparison: <span className="text-accent">{result.yourProduct.productName}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {aggregatedTable.products.length} products · {aggregatedTable.aspects.length} aspects ·{" "}
          {aggregatedTable.crossSourceFlags.length} cross-source flags
        </p>
      </motion.div>

      {/* Top metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total cost" value={fmtCost(metrics.totalCost)} icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Total latency" value={fmtLatency(metrics.totalLatencyMs)} icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Cache hits" value={`${metrics.cacheHits}/${metrics.cacheHits + metrics.cacheMisses}`} icon={<Database className="w-4 h-4" />} />
        <MetricCard label="LLM confidence" value={`${Math.round((insight?.confidence ?? 0) * 100)}%`} icon={<ShieldCheck className="w-4 h-4" />} />
      </div>

      {/* Product comparison cards */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          Side-by-side comparison
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aggregatedTable.products.map((p, i) => (
            <ProductCard key={p.productId} product={p} index={i} delay={i * 0.1} />
          ))}
        </div>
      </div>

      {/* Aspect comparison bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Aspect frequency comparison
          </CardTitle>
          <CardDescription>
            How often each aspect is mentioned per product. Hover bars for sentiment + example quotes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AspectBarChart products={aggregatedTable.products} aspects={aggregatedTable.aspects} />
        </CardContent>
      </Card>

      {/* Top complaints */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Top complaints
            </CardTitle>
            <CardDescription>Expandable cards with example review quotes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {aggregatedTable.products.flatMap((p, i) =>
                p.topComplaints.slice(0, 2).map((c, j) => (
                  <ComplaintCard
                    key={`${i}-${j}`}
                    productName={p.productName}
                    aspect={c.aspect}
                    frequency={c.frequency}
                    sentiment={c.sentiment}
                    quotes={c.exampleQuotes}
                  />
                )),
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Top praises
            </CardTitle>
            <CardDescription>What people love about each product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {aggregatedTable.products.flatMap((p, i) =>
                p.topPraises.slice(0, 2).map((c, j) => (
                  <ComplaintCard
                    key={`p-${i}-${j}`}
                    productName={p.productName}
                    aspect={c.aspect}
                    frequency={c.frequency}
                    sentiment={c.sentiment}
                    quotes={c.exampleQuotes}
                  />
                )),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-source disagreements */}
      {aggregatedTable.crossSourceFlags.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Cross-source disagreements
            </CardTitle>
            <CardDescription>
              Marketplace vs organic (Reddit/blog) sentiment mismatches — treat with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aggregatedTable.crossSourceFlags.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-warning/30 bg-warning/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-sm">{f.aspect}</span>
                    <Badge variant="outline" className={f.severity === "warning" ? "border-warning text-warning" : ""}>
                      {f.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <Badge variant="outline">marketplace: {f.marketplaceSentiment}</Badge>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline">organic: {f.organicSentiment}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.disagreementNote}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verdict + opportunities */}
      {insight && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-accent/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Final verdict
              </CardTitle>
              <CardDescription>
                Single Gemini call synthesized from the aggregated table ·{" "}
                confidence {Math.round(insight.confidence * 100)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                {insight.verdictText.split("\n").map((para, i) => (
                  <p key={i} className="text-foreground/90 leading-relaxed mb-3">
                    {para}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Opportunities
              </CardTitle>
              <CardDescription>For your product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insight.opportunities.map((op, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{op.title}</h4>
                      <Badge variant="outline" className={
                        op.impact === "high" ? "border-accent text-accent" : ""
                      }>
                        {op.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{op.rationale}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost / latency panel */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Agent cost &amp; latency breakdown
          </CardTitle>
          <CardDescription>
            Per-node telemetry — every API call tracked, every dollar logged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-xs">
            <div className="grid grid-cols-4 gap-3 text-muted-foreground border-b border-border pb-2 mb-2">
              <span>Node</span>
              <span className="text-right">Cost</span>
              <span className="text-right">Latency</span>
              <span className="text-right">Status</span>
            </div>
            {metrics.nodeLogs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-4 gap-3 py-1"
              >
                <span className="text-foreground">{log.nodeName}</span>
                <span className="text-right text-accent">{fmtCost(log.cost)}</span>
                <span className="text-right text-muted-foreground">{fmtLatency(log.latencyMs)}</span>
                <span className="text-right">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    log.status === "ok" ? "bg-success" :
                    log.status === "error" ? "bg-destructive" :
                    log.status === "partial" ? "bg-warning" : "bg-muted"
                  }`} />
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProductCard({ product, index, delay }: { product: any; index: number; delay: number }) {
  const isYours = product.role === "your_product";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={isYours ? "border-accent/40 bg-accent/5" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={isYours ? "border-accent text-accent" : ""}>
              {isYours ? "Your product" : "Competitor"}
            </Badge>
            {product.dataQuality !== "full" && (
              <Badge variant="outline" className="text-warning border-warning/40">
                {product.dataQuality} data
              </Badge>
            )}
          </div>
          <CardTitle className="font-display text-lg leading-tight mt-2">{product.productName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Stat label="Rating" value={product.rating ? `${product.rating.toFixed(1)}★` : "—"} icon={<Star className="w-3 h-3" />} />
            <Stat label="Price" value={product.price ? `$${product.price.toFixed(0)}` : "—"} icon={<DollarSign className="w-3 h-3" />} />
            <Stat label="Reviews" value={String(product.reviewCount)} icon={<Layers className="w-3 h-3" />} />
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <div className="text-xs text-muted-foreground mb-1">Aspect summary</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {product.aspects.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="truncate">{a.aspect}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      a.sentiment === "positive" ? "bg-success" :
                      a.sentiment === "negative" ? "bg-destructive" :
                      a.sentiment === "mixed" ? "bg-warning" : "bg-muted"
                    }`} />
                    <span className="text-muted-foreground">{a.frequency}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-display font-semibold">{value}</div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-muted-foreground">{icon}</span>
          </div>
          <div className="font-display text-2xl font-bold animate-count-up">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ComplaintCard({
  productName,
  aspect,
  frequency,
  sentiment,
  quotes,
}: {
  productName: string;
  aspect: string;
  frequency: number;
  sentiment: string;
  quotes: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-card/60 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${
              sentiment === "positive" ? "bg-success" :
              sentiment === "negative" ? "bg-destructive" :
              sentiment === "mixed" ? "bg-warning" : "bg-muted"
            }`} />
            <span className="font-medium text-sm">{aspect}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 ml-3.5">{productName} · {frequency} mentions</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && quotes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              {quotes.map((q, i) => (
                <div key={i} className="text-xs text-muted-foreground italic border-l-2 border-accent/40 pl-2">
                  "{q}"
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Aspect comparison bar chart ----------

function AspectBarChart({ products, aspects }: { products: any[]; aspects: string[] }) {
  const data = aspects.map((aspect) => {
    const row: any = { aspect };
    for (const p of products) {
      const found = p.aspects.find((a: any) => a.aspect === aspect);
      row[p.productName] = found ? found.frequency : 0;
    }
    return row;
  });

  const colors = ["oklch(0.78 0.18 65)", "oklch(0.7 0.15 145)", "oklch(0.7 0.13 220)", "oklch(0.7 0.2 300)"];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 60)" />
        <XAxis
          dataKey="aspect"
          angle={-35}
          textAnchor="end"
          tick={{ fill: "oklch(0.66 0.01 60)", fontSize: 11 }}
          stroke="oklch(0.28 0.012 60)"
          interval={0}
        />
        <YAxis tick={{ fill: "oklch(0.66 0.01 60)", fontSize: 11 }} stroke="oklch(0.28 0.012 60)" />
        <Tooltip
          cursor={{ fill: "oklch(0.78 0.18 65 / 0.08)" }}
          contentStyle={{
            backgroundColor: "oklch(0.19 0.014 60)",
            border: "1px solid oklch(0.28 0.012 60)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        {products.map((p, i) => (
          <Bar
            key={p.productId}
            dataKey={p.productName}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
            animationDuration={800 + i * 200}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- helpers ----------

function fmtCost(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(4)}`;
}

function fmtLatency(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}
