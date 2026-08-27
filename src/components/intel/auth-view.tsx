"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth, useUI } from "@/lib/store";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await api.register(email, password, name || undefined)
          : await api.login(email, password);
      setAuth(result.user, result.token);
      toast({
        title: mode === "register" ? "Welcome to ClarifyAI" : "Welcome back",
        description: result.user.email,
      });
      goDashboard();
    } catch (e: any) {
      toast({ title: "Couldn't sign you in", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail("demo@clarify.ai");
    setPassword("demo1234");
    setName("Alex Rivera");
    setMode("register");
  }

  return (
    <div className="min-h-screen bg-ambient bg-grid relative overflow-hidden">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.18 65), transparent)" }}
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 -right-40 w-[32rem] h-[32rem] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.15 145), transparent)" }}
        animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="px-5 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="ClarifyAI" width={36} height={36} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-semibold text-lg tracking-tight">ClarifyAI</span>
            </div>
          </div>
          <a
            href="#get-started"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Already have an account? <span className="text-accent">Sign in</span>
          </a>
        </header>

        {/* Main content — fits above the fold on most screens */}
        <main className="flex-1 px-5 md:px-10 pb-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center min-h-[calc(100vh-12rem)]">
            {/* LEFT — pitch */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium w-fit mb-5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-amber" />
                AI-Powered Competitive Intelligence Platform
              </motion.div>

              <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-[3.4rem] tracking-tight leading-[1.05]">
                Stop guessing what people think.<br />
                <span className="text-accent">Know in 30 seconds.</span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Paste a product link and we'll read every review, cross-check it against
                Reddit and blogs, and tell you exactly what people love, what they wish was
                better, and where you can win — side by side with your competitors.
              </p>

              {/* Three simple steps */}
              <div className="mt-8 grid gap-3 max-w-xl">
                {[
                  { n: "01", t: "Paste your product link", d: "Amazon, Flipkart, or just a name" },
                  { n: "02", t: "We read what people say", d: "Hundreds of reviews + Reddit + blogs" },
                  { n: "03", t: "Get the plain-English truth", d: "Side-by-side comparison + your next move" },
                ].map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-start gap-4 group"
                  >
                    <span className="font-mono text-xs text-accent/80 mt-0.5 w-7 flex-shrink-0">{s.n}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.t}</div>
                      <div className="text-xs text-muted-foreground">{s.d}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust signals */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Real review data, not AI guesses
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Cross-checked across sources
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-info" />
                  Results in under a minute
                </span>
              </div>
            </motion.section>

            {/* RIGHT — auth card */}
            <motion.section
              id="get-started"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
            >
              <Card className="bg-card/70 backdrop-blur-xl border-border shadow-2xl shadow-black/20">
                <CardContent className="p-6 md:p-7">
                  <div className="mb-5">
                    <h2 className="font-display text-2xl font-semibold leading-tight">
                      {mode === "register" ? "Start your first analysis" : "Welcome back"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === "register" ? "Free to try. No card required." : "Pick up where you left off."}
                    </p>
                  </div>

                  <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                    <TabsList className="grid grid-cols-2 mb-5">
                      <TabsTrigger value="register">Create account</TabsTrigger>
                      <TabsTrigger value="login">Sign in</TabsTrigger>
                    </TabsList>

                    <TabsContent value={mode}>
                      <form onSubmit={onSubmit} className="space-y-3.5">
                        {mode === "register" && (
                          <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs text-muted-foreground">Name (optional)</Label>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alex Rivera"
                                className="pl-10 h-11"
                              />
                            </div>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@company.com"
                              className="pl-10 h-11"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="At least 6 characters"
                              className="pl-10 pr-10 h-11"
                              minLength={6}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full glow-accent h-11 mt-2"
                        >
                          {loading ? (
                            "Setting up…"
                          ) : (
                            <>
                              {mode === "register" ? "Get started free" : "Sign in"}
                              <ArrowRight className="w-4 h-4 ml-1.5" />
                            </>
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={fillDemo}
                          className="w-full text-xs text-muted-foreground hover:text-accent transition-colors pt-1"
                        >
                          Use demo credentials →
                        </button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.section>
          </div>
        </main>

        <footer className="px-5 md:px-10 py-4 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
          <span>© ClarifyAI — Know what your customers really think.</span>
          <span className="font-mono">v1.0</span>
        </footer>
      </div>
    </div>
  );
}
