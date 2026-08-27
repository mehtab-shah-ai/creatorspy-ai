"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth, useUI } from "@/lib/store";
import { api, type HistoryRun } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  ChevronRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: {
    label: "Ready",
    color: "bg-success/15 text-success border-success/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  running: {
    label: "Working on it",
    color: "bg-accent/15 text-accent border-accent/30",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  pending: {
    label: "Queued",
    color: "bg-muted text-muted-foreground border-border",
    icon: <Clock className="w-3 h-3" />,
  },
  failed: {
    label: "Something went wrong",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

function fmtDate(s: string) {
  const d = new Date(s);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function DashboardView() {
  const { user, logout, token } = useAuth();
  const { goNewAnalysis, openResults } = useUI();
  const { toast } = useToast();
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.getHistory(token).then((r) => {
      if (!cancelled) {
        setRuns(r);
        setLoading(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        toast({ title: "Couldn't load your reports", description: e.message, variant: "destructive" });
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [token, toast]);

  function handleLogout() {
    logout();
    useUI.setState({ view: "auth" });
  }

  const completed = runs.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-ambient">
      <header className="border-b border-border bg-card/30 backdrop-blur sticky top-0 z-30">
        <div className="px-5 md:px-10 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="ClarifyAI" width={32} height={32} />
            <span className="font-display font-semibold tracking-tight">ClarifyAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="px-5 md:px-10 py-8 max-w-5xl mx-auto">
        {/* Greeting + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {greeting()}, {user?.name ?? user?.email?.split("@")[0]}.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            {runs.length === 0
              ? "Let's find out what people really think about your product — and your competitors."
              : `${completed} ${completed === 1 ? "report" : "reports"} ready. Run another analysis whenever you want.`}
          </p>
          <Button
            onClick={goNewAnalysis}
            size="lg"
            className="mt-5 glow-accent h-11"
          >
            <Plus className="w-4 h-4" /> Start new analysis
          </Button>
        </motion.div>

        {/* Past reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">Your past reports</h2>
            {runs.length > 0 && (
              <span className="text-sm text-muted-foreground">{runs.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-card/40 border border-border animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/30">
              <CardContent className="py-14 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">No reports yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Paste a product link and we'll read every review so you don't have to.
                </p>
                <Button onClick={goNewAnalysis} className="glow-accent">
                  <Plus className="w-4 h-4 mr-1" /> Start your first analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {runs.map((run, i) => {
                const meta = STATUS_META[run.status] ?? STATUS_META.pending;
                return (
                  <motion.div
                    key={run.runId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <Card
                      className="cursor-pointer hover:border-accent/40 hover:bg-card/80 transition-all group"
                      onClick={() => openResults(run.runId)}
                    >
                      <CardContent className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <span className="font-medium truncate font-display text-sm md:text-base">
                              {cleanProductName(run.yourProductInput)}
                            </span>
                            <Badge variant="outline" className={meta.color}>
                              {meta.icon}
                              <span className="ml-1">{meta.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {fmtDate(run.createdAt)}
                            </span>
                            <span>{run.productCount} products compared</span>
                            {run.status === "running" && (
                              <span className="text-accent">Reading reviews…</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function cleanProductName(input: string): string {
  // If it's a URL, try to extract something readable
  if (/^https?:\/\//i.test(input)) {
    const amazonMatch = input.match(/\/dp\/([A-Z0-9]{10})/i);
    if (amazonMatch) return `Amazon product ${amazonMatch[1]}`;
    return "Linked product";
  }
  // Truncate long names
  if (input.length > 60) return input.slice(0, 57) + "…";
  return input;
}
