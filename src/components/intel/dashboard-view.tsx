"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth, useUI } from "@/lib/store";
import { api, type HistoryRun } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Plus, Clock, DollarSign, ChevronRight, LogOut, Zap, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/30",
  running: "bg-accent/15 text-accent border-accent/30",
  pending: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function fmtCost(n: number) {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `<$0.01`;
  return `$${n.toFixed(4)}`;
}

function fmtLatency(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtDate(s: string) {
  const d = new Date(s);
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
    api.getHistory(token).then((r) => {
      setRuns(r);
      setLoading(false);
    }).catch((e) => {
      toast({ title: "Failed to load history", description: e.message, variant: "destructive" });
      setLoading(false);
    });
  }, [token, toast]);

  function handleLogout() {
    logout();
    useUI.setState({ view: "auth" });
  }

  return (
    <div className="min-h-screen bg-ambient">
      <header className="border-b border-border bg-card/30 backdrop-blur sticky top-0 z-30">
        <div className="px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-display font-semibold">Competitor Intel</div>
              <div className="text-xs text-muted-foreground">Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-12 py-8 max-w-6xl mx-auto">
        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Welcome back, {user?.name ?? user?.email?.split("@")[0]}.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Run a new competitive analysis, or pick up where you left off.
          </p>
          <Button
            onClick={goNewAnalysis}
            size="lg"
            className="mt-6 glow-accent"
          >
            <Plus className="w-4 h-4" /> New Analysis
          </Button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <StatCard label="Total runs" value={String(runs.length)} icon={<History className="w-4 h-4" />} />
          <StatCard
            label="Completed"
            value={String(runs.filter((r) => r.status === "completed").length)}
            icon={<Zap className="w-4 h-4" />}
          />
          <StatCard
            label="Total spend"
            value={fmtCost(runs.reduce((s, r) => s + (r.totalCost ?? 0), 0))}
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatCard
            label="Avg latency"
            value={
              runs.length === 0
                ? "—"
                : fmtLatency(
                    runs.reduce((s, r) => s + (r.totalLatencyMs ?? 0), 0) /
                      Math.max(1, runs.filter((r) => r.status === "completed").length),
                  )
            }
            icon={<Clock className="w-4 h-4" />}
          />
        </motion.div>

        {/* History list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Recent runs</h2>
            {runs.length > 0 && (
              <span className="text-sm text-muted-foreground">{runs.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-card/40 border border-border animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">No analyses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Run your first competitive analysis to see results here.</p>
                <Button onClick={goNewAnalysis}>
                  <Plus className="w-4 h-4 mr-1" /> New Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {runs.map((run, i) => (
                <motion.div
                  key={run.runId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-accent/40 hover:bg-card/80 transition-all"
                    onClick={() => openResults(run.runId)}
                  >
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-medium truncate font-display">
                            {run.yourProductInput}
                          </span>
                          <Badge className={STATUS_COLOR[run.status] ?? STATUS_COLOR.pending}>
                            {run.status}
                          </Badge>
                          {run.status === "running" && run.currentNode && (
                            <span className="text-xs text-muted-foreground">at {run.currentNode}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtDate(run.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {fmtCost(run.totalCost)}
                          </span>
                          <span>{run.productCount} products</span>
                          {run.totalLatencyMs > 0 && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {fmtLatency(run.totalLatencyMs)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
