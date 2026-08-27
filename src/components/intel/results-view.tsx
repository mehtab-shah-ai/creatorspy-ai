"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth, useUI } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { AnalysisResultDTO, RunStatusDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  ExternalLink,
  Sparkles,
  Quote,
  Heart,
  AlertCircle,
  Loader2,
  Trophy,
  RefreshCw,
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

// Friendly step labels — replaces node names entirely
const STEPS = [
  { id: "inputValidator", label: "Reading your product details", icon: "📖" },
  { id: "competitorResolver", label: "Finding your competitors", icon: "🔍" },
  { id: "scraper", label: "Reading every review", icon: "💬" },
  { id: "clustering", label: "Grouping what people say", icon: "🗂️" },
  { id: "aspectLabeling", label: "Understanding the sentiment", icon: "🧠" },
  { id: "aggregation", label: "Putting it all together", icon: "🧩" },
  { id: "crossSourceVerification", label: "Cross-checking online chatter", icon: "🔎" },
  { id: "insightSynthesis", label: "Writing your verdict", icon: "✍️" },
  { id: "selfVerification", label: "Double-checking every claim", icon: "✓" },
  { id: "costLogger", label: "Wrapping up", icon: "🎁" },
];

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
          try {
            const r = await api.getResult(activeRunId, token);
            if (cancelled) return;
            setResult(r);
            setLoading(false);
            if (pollRef.current) clearTimeout(pollRef.current);
          } catch (e: any) {
            if (!cancelled) {
              toast({ title: "Couldn't load the report", description: e?.message, variant: "destructive" });
              setLoading(false);
            }
          }
        } else if (s.status === "failed") {
          setLoading(false);
          if (pollRef.current) clearTimeout(pollRef.current);
        } else {
          // Faster polling — 600ms feels instant
          pollRef.current = setTimeout(poll, 600);
        }
      } catch (e: any) {
        if (!cancelled) {
          toast({ title: "Lost connection", description: e?.message, variant: "destructive" });
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
            <p className="text-muted-foreground mb-4">No report selected.</p>
            <Button onClick={goDashboard}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = status?.status === "running" || status?.status === "pending";

  return (
    <div className="min-h-screen bg-ambient">
      <header className="border-b border-border bg-card/30 backdrop-blur sticky top-0 z-30">
        <div className="px-5 md:px-10 py-3.5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goDashboard} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to reports
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ClarifyAI" width={28} height={28} />
            <span className="font-display font-semibold text-sm hidden md:block">ClarifyAI</span>
          </div>
        </div>
      </header>

      <main className="px-5 md:px-10 py-8 max-w-6xl mx-auto">
        {isRunning && <LiveProgress status={status!} />}
        {!isRunning && status?.status === "failed" && (
          <Card className="border-destructive/40 max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-3" />
              <h2 className="font-display text-xl font-semibold mb-2">We couldn't finish this one</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {status?.errorMessage ?? "Something went wrong on our end. Please try again."}
              </p>
              <Button onClick={goDashboard}>Back to dashboard</Button>
            </CardContent>
          </Card>
        )}
        {!isRunning && result && <ReportDisplay result={result} onBack={goDashboard} />}
      </main>
    </div>
  );
}

// ---------- Live progress (friendly) ----------

function LiveProgress({ status }: { status: RunStatusDTO }) {
  const currentStepIdx = status.currentNode ? STEPS.findIndex((s) => s.id === status.currentNode) : -1;
  const displayStep = currentStepIdx >= 0 ? STEPS[currentStepIdx] : STEPS[0];
  const percent = Math.round((status.progress ?? 0) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl mb-4 inline-block"
        >
          {displayStep.icon}
        </motion.div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          {displayStep.label}
          <span className="inline-block w-1 h-6 bg-accent ml-1 animate-pulse align-middle" />
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {percent < 30 && "Just getting started…"}
          {percent >= 30 && percent < 60 && "Reading every review we can find…"}
          {percent >= 60 && percent < 90 && "Putting the pieces together…"}
          {percent >= 90 && "Almost ready…"}
        </p>
      </motion.div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent/80 to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{percent}% done</span>
            <span>Usually takes about a minute</span>
          </div>
        </CardContent>
      </Card>

      {/* What's happening */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((step, idx) => {
          const done = idx < currentStepIdx;
          const active = idx === currentStepIdx;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-lg border p-2.5 transition-all ${
                active
                  ? "border-accent/50 bg-accent/5"
                  : done
                    ? "border-success/30 bg-success/5"
                    : "opacity-50 border-border"
              }`}
            >
              <div className="text-lg mb-1 text-center">
                {done ? "✓" : step.icon}
              </div>
              <div className="text-[10px] text-muted-foreground text-center leading-tight">
                {step.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Report display ----------

function ReportDisplay({ result, onBack }: { result: AnalysisResultDTO; onBack: () => void }) {
  const { aggregatedTable, insight, yourProduct, competitors } = result;
  const allProducts = [yourProduct, ...competitors];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-success text-xs font-medium uppercase tracking-wide">Report ready</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          Here's what people really think.
        </h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg max-w-2xl">
          We read {totalReviews(allProducts)} reviews across {allProducts.length} products and
          cross-checked them against Reddit and blog discussions.
        </p>
      </motion.div>

      {/* Side-by-side cards */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Side-by-side</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProducts.map((p, i) => (
            <ProductCard key={p.productId} product={p} isYours={i === 0} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* What people talk about most */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            What people talk about most
          </CardTitle>
          <CardDescription>
            How often each topic comes up — across all {allProducts.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AspectBarChart products={allProducts} aspects={aggregatedTable.aspects} />
        </CardContent>
      </Card>

      {/* What people love / wish was better */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-success/20">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Heart className="w-5 h-5 text-success" />
              What people love
            </CardTitle>
            <CardDescription>Tap any topic to see real quotes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {allProducts.flatMap((p, i) =>
                p.topPraises.slice(0, 2).map((c, j) => (
                  <ExpandableTopic
                    key={`love-${i}-${j}`}
                    productName={p.productName}
                    aspect={c.aspect}
                    frequency={c.frequency}
                    sentiment={c.sentiment}
                    quotes={c.exampleQuotes}
                    variant="love"
                  />
                )),
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-warning" />
              What people wish was better
            </CardTitle>
            <CardDescription>Where the complaints cluster — your biggest opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {allProducts.flatMap((p, i) =>
                p.topComplaints.slice(0, 2).map((c, j) => (
                  <ExpandableTopic
                    key={`wish-${i}-${j}`}
                    productName={p.productName}
                    aspect={c.aspect}
                    frequency={c.frequency}
                    sentiment={c.sentiment}
                    quotes={c.exampleQuotes}
                    variant="wish"
                  />
                )),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heads up — different opinions online */}
      {aggregatedTable.crossSourceFlags.length > 0 && (
        <Card className="border-info/30">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-info" />
              Heads up — the internet disagrees
            </CardTitle>
            <CardDescription>
              Sometimes what Amazon reviews say doesn't match what people say on Reddit or blogs. Here's where they disagree.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aggregatedTable.crossSourceFlags.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-info/30 bg-info/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-sm">{f.aspect}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{f.disagreementNote}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Our take */}
      {insight && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Our take
              </CardTitle>
              <CardDescription>
                The plain-English version of everything we just read
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insight.verdictText.split("\n").filter((p) => p.trim().length > 0).map((para, i) => (
                  <p key={i} className="text-foreground/90 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Trophy className="w-5 h-5 text-accent" />
                Your chance to win
              </CardTitle>
              <CardDescription>Things you could lean into or fix</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {insight.opportunities.map((op, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-medium text-sm leading-snug">{op.title}</h4>
                      <Badge variant="outline" className={
                        op.impact === "high" ? "border-accent text-accent flex-shrink-0" : "flex-shrink-0"
                      }>
                        {op.impact === "high" ? "Big win" : op.impact === "medium" ? "Worth it" : "Nice to have"}
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

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh this report
        </Button>
        <Button onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to all reports
        </Button>
      </div>
    </motion.div>
  );
}

function totalReviews(products: any[]): number {
  return products.reduce((s, p) => s + (p.reviewCount || 0), 0);
}

function ProductCard({ product, isYours, delay }: { product: any; isYours: boolean; delay: number }) {
  const price = formatPrice(product.price, product.currency);
  const sourceUrl = product.sourceUrl;
  const sourceLabel = sourceUrl ? safeHostname(sourceUrl) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={isYours ? "border-accent/40 bg-accent/5" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={isYours ? "border-accent text-accent" : ""}>
              {isYours ? "★ Your product" : "Competitor"}
            </Badge>
            {product.dataQuality !== "full" && (
              <Badge variant="outline" className="text-warning border-warning/40 text-xs">
                Limited data
              </Badge>
            )}
          </div>
          <CardTitle className="font-display text-base md:text-lg leading-snug mt-2 line-clamp-2">
            {product.productName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Price + rating + reviews — real numbers */}
          <div className="grid grid-cols-3 gap-2">
            <ProductStat
              label="Price"
              value={price}
              icon={<span className="text-xs">💰</span>}
            />
            <ProductStat
              label="Rating"
              value={product.rating ? `${product.rating.toFixed(1)}★` : "—"}
              icon={<Star className="w-3 h-3 fill-current" />}
            />
            <ProductStat
              label="Reviews"
              value={product.reviewCount.toLocaleString()}
              icon={<span className="text-xs">💬</span>}
            />
          </div>

          {/* Source link */}
          {sourceLabel && sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View on {sourceLabel}
            </a>
          )}

          {/* Quick aspect summary */}
          {product.aspects.length > 0 && (
            <div className="pt-2 border-t border-border space-y-1">
              <div className="text-xs text-muted-foreground mb-1.5">Top topics</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {product.aspects.slice(0, 5).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs gap-2">
                    <span className="truncate">{a.aspect}</span>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function ProductStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </div>
      <div className="font-display font-semibold text-sm">{value}</div>
    </div>
  );
}

function ExpandableTopic({
  productName,
  aspect,
  frequency,
  sentiment,
  quotes,
  variant,
}: {
  productName: string;
  aspect: string;
  frequency: number;
  sentiment: string;
  quotes: string[];
  variant: "love" | "wish";
}) {
  const [expanded, setExpanded] = useState(false);
  // Static class strings — Tailwind needs literal class names to generate them
  const dotClass = variant === "love" ? "bg-success" : "bg-warning";

  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-card/60 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <span className="font-medium text-sm capitalize">{aspect}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 ml-3.5">
            {productName} · {frequency} {frequency === 1 ? "mention" : "mentions"}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""} flex-shrink-0`} />
      </button>
      <AnimatePresence>
        {expanded && quotes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2.5">
              {quotes.map((q, i) => (
                <div key={i} className="text-xs text-foreground/80 italic flex gap-2">
                  <Quote className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Aspect bar chart ----------

function AspectBarChart({ products, aspects }: { products: any[]; aspects: string[] }) {
  const data = aspects.map((aspect) => {
    const row: any = { aspect };
    for (const p of products) {
      const found = p.aspects.find((a: any) => a.aspect === aspect);
      row[p.productName.length > 25 ? `Product ${products.indexOf(p) + 1}` : p.productName] = found ? found.frequency : 0;
    }
    return row;
  });

  const colors = ["oklch(0.78 0.18 65)", "oklch(0.7 0.15 145)", "oklch(0.7 0.13 220)", "oklch(0.7 0.2 300)"];

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 90 }}>
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
            dataKey={p.productName.length > 25 ? `Product ${i + 1}` : p.productName}
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

function formatPrice(price: number | undefined | null, currency: string | undefined): string {
  if (price == null || isNaN(price)) return "—";
  // Show real currency symbol — ₹ for INR, $ for USD, etc.
  const c = (currency || "USD").toUpperCase();
  if (c === "INR" || c === "₹") return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (c === "USD" || c === "$") return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (c === "EUR" || c === "€") return `€${price.toLocaleString("de-DE", { maximumFractionDigits: 2 })}`;
  if (c === "GBP" || c === "£") return `£${price.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
  return `${price.toLocaleString()} ${currency}`;
}
