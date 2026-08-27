"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, useUI } from "@/lib/store";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowLeft,
  Search,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  Layers,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NewAnalysisView() {
  const { token } = useAuth();
  const { goDashboard, openResults } = useUI();
  const { toast } = useToast();

  const [yourProduct, setYourProduct] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(["", ""]);
  const [autoFind, setAutoFind] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function addCompetitor() {
    if (competitors.length >= 3) return;
    setCompetitors((c) => [...c, ""]);
  }
  function removeCompetitor(idx: number) {
    setCompetitors((c) => c.filter((_, i) => i !== idx));
  }
  function updateCompetitor(idx: number, val: string) {
    setCompetitors((c) => c.map((v, i) => (i === idx ? val : v)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (yourProduct.trim().length < 3) {
      toast({ title: "Add your product", description: "Enter an Amazon/Flipkart link or product name.", variant: "destructive" });
      return;
    }
    if (!autoFind) {
      const filled = competitors.filter((c) => c.trim().length > 0);
      if (filled.length === 0) {
        toast({ title: "Add competitors or enable auto-find", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const filled = competitors.filter((c) => c.trim().length > 0);
      const result = await api.startAnalysis(
        {
          yourProduct: yourProduct.trim(),
          competitors: filled,
          autoFind,
        },
        token!,
      );
      toast({
        title: result.demoMode ? "Analysis started (demo mode)" : "Analysis started",
        description: result.demoMode
          ? "Some API keys are missing — pipeline will run with synthetic data."
          : "Pipeline is running. Live progress will appear on the results page.",
      });
      openResults(result.runId);
    } catch (e: any) {
      toast({ title: "Failed to start", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ambient">
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
            <div className="font-display font-semibold hidden md:block">New Analysis</div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-12 py-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Set up your analysis.
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your product, your competitors. The agent pipeline does the rest.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Product inputs</CardTitle>
                <CardDescription>
                  Paste an Amazon / Flipkart link or just type a product name. The validator
                  extracts ASINs before any paid API calls fire.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Your product */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Your product
                    </Label>
                    <Input
                      value={yourProduct}
                      onChange={(e) => setYourProduct(e.target.value)}
                      placeholder="https://www.amazon.com/dp/B0CHX1W1XY or 'Sony WH-1000XM5'"
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Link preferred — auto-extracts ASIN for cheaper cache hits.
                    </p>
                  </div>

                  {/* Competitors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                        Competitor products
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Auto-find</span>
                        <Switch checked={autoFind} onCheckedChange={setAutoFind} />
                      </div>
                    </div>

                    {autoFind ? (
                      <Card className="bg-accent/5 border-accent/30 border-dashed">
                        <CardContent className="py-4 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Auto-discovery enabled</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              The pipeline will query Serper (Google Shopping) for 3 competitors
                              matching your product, with automatic Tavily fallback if Serper is
                              rate-limited.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {competitors.map((c, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-2"
                          >
                            <Input
                              value={c}
                              onChange={(e) => updateCompetitor(idx, e.target.value)}
                              placeholder={`Competitor #${idx + 1} — link or name`}
                            />
                            {competitors.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCompetitor(idx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </motion.div>
                        ))}
                        {competitors.length < 3 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCompetitor}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add competitor (max 3)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    size="lg"
                    className="w-full glow-accent"
                  >
                    {submitting ? (
                      "Starting pipeline…"
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" /> Run 11-node pipeline
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pipeline preview sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/40 sticky top-24">
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  Pipeline preview
                </CardTitle>
                <CardDescription>
                  11 nodes · parallel fan-out · cost-controlled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {PIPELINE_NODES.map((n, i) => (
                    <li key={n.id} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-muted/60 border border-border text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-mono">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium">{n.name}</div>
                        <div className="text-xs text-muted-foreground">{n.desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    <span>48h SQLite cache — no duplicate scrapes</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span>Groq timeout → auto Gemini fallback</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5 text-info" />
                    <span>Self-verification flags unsupported claims</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

const PIPELINE_NODES = [
  { id: "validator", name: "Input Validator", desc: "Parse link vs name, extract ASIN" },
  { id: "resolver", name: "Competitor Resolver", desc: "Serper → Tavily fallback" },
  { id: "scraper", name: "Scraper Agent", desc: "Apify + Firecrawl×2 in parallel" },
  { id: "cache", name: "Cache Check", desc: "48h SQLite cache before scrape" },
  { id: "cluster", name: "Clustering Node", desc: "HF embeddings + cosine sim" },
  { id: "label", name: "Aspect Labeling", desc: "Groq batches of 10-15" },
  { id: "agg", name: "Aggregation", desc: "Pure code, deterministic" },
  { id: "xverify", name: "Cross-Source Verify", desc: "Marketplace vs organic" },
  { id: "synth", name: "Insight Synthesis", desc: "One Gemini call" },
  { id: "verify", name: "Self-Verification", desc: "Re-check claims vs data" },
  { id: "cost", name: "Cost Logger", desc: "Persist to SQLite" },
];
