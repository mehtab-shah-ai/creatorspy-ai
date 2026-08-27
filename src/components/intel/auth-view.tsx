"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, useUI } from "@/lib/store";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Mail, Lock, User as UserIcon, ArrowRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthView() {
  const { setAuth } = useAuth();
  const { goDashboard } = useUI();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await api.register(email, password, name || undefined)
          : await api.login(email, password);
      setAuth(result.user, result.token);
      toast({ title: mode === "register" ? "Account created" : "Welcome back", description: result.user.email });
      goDashboard();
    } catch (e: any) {
      toast({ title: "Authentication failed", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@intel.local");
    setPassword("demo1234");
    setName("Demo User");
    setMode("register");
  }

  return (
    <div className="min-h-screen bg-ambient bg-grid relative overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.18 65), transparent)" }}
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.13 220), transparent)" }}
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Brand header */}
        <header className="px-6 lg:px-12 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-display font-semibold text-lg leading-none">Competitor Intel</div>
              <div className="text-xs text-muted-foreground mt-0.5">Agentic review intelligence</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-accent" />
            <span>LangGraph · 11-node pipeline</span>
          </div>
        </header>

        {/* Main split: hero + auth */}
        <main className="flex-1 grid lg:grid-cols-2 gap-8 px-6 lg:px-12 pb-12">
          {/* Left: hero */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium w-fit mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-amber" />
              Autonomous agent pipeline
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Don't read 400 reviews.
              <br />
              <span className="text-accent">Let eleven agents do it.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-md">
              Submit your product and 1–3 competitors. An agentic LangGraph pipeline scrapes
              marketplace reviews, cross-verifies against Reddit and blogs, clusters by aspect,
              and returns a parallel side-by-side comparison — with live cost telemetry.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: "11", v: "Graph nodes" },
                { k: "48h", v: "Cache TTL" },
                { k: "6", v: "Data sources" },
              ].map((s, i) => (
                <motion.div
                  key={s.v}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-lg border border-border bg-card/40 backdrop-blur p-3"
                >
                  <div className="font-display font-bold text-2xl text-accent">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Right: auth card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <Card className="w-full max-w-md bg-card/70 backdrop-blur-xl border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-display">
                  {mode === "register" ? "Create your account" : "Welcome back"}
                </CardTitle>
                <CardDescription>
                  Start your first analysis in under 30 seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="register">Register</TabsTrigger>
                    <TabsTrigger value="login">Login</TabsTrigger>
                  </TabsList>

                  <TabsContent value={mode}>
                    <form onSubmit={onSubmit} className="space-y-4">
                      {mode === "register" && (
                        <div className="space-y-2">
                          <Label htmlFor="name">Name (optional)</Label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Alex Rivera"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="pl-10"
                            minLength={6}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full glow-accent"
                        size="lg"
                      >
                        {loading
                          ? "Working…"
                          : mode === "register"
                            ? "Create account"
                            : "Sign in"}
                        {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
                      </Button>
                      <button
                        type="button"
                        onClick={fillDemo}
                        className="w-full text-xs text-muted-foreground hover:text-accent transition-colors pt-2"
                      >
                        Fill demo credentials →
                      </button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.section>
        </main>

        <footer className="mt-auto px-6 lg:px-12 py-4 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
          <span>SQLite · LangGraph.js · Next.js 16 · Free-tier APIs</span>
          <span>v0.1.0</span>
        </footer>
      </div>
    </div>
  );
}
