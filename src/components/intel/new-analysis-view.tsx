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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  Search,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Grocery",
  "Other",
] as const;

type Platform = "amazon" | "flipkart" | "both";

export function NewAnalysisView() {
  const { token } = useAuth();
  const { goDashboard, openResults } = useUI();
  const { toast } = useToast();

  // 1. Product link (optional)
  const [productLink, setProductLink] = useState("");
  // 2. Product name (required if no link)
  const [productName, setProductName] = useState("");
  // 3. Category (required)
  const [category, setCategory] = useState<string>("Electronics");
  // 4. Price range (required, in INR)
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  // 5. Platform (required, default both)
  const [platform, setPlatform] = useState<Platform>("both");
  // 6. Competitors
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

    // Validation: either link or name required
    if (!productLink.trim() && !productName.trim()) {
      toast({ title: "Add your product", description: "Paste a link or type a product name.", variant: "destructive" });
      return;
    }

    // Validation: price range required
    const pMin = parseFloat(priceMin);
    const pMax = parseFloat(priceMax);
    if (isNaN(pMin) || isNaN(pMax) || pMax <= pMin) {
      toast({ title: "Fix the price range", description: "Enter a min and max price (max must be greater than min).", variant: "destructive" });
      return;
    }

    // Validation: competitors required unless auto-find
    if (!autoFind) {
      const filled = competitors.filter((c) => c.trim().length > 0);
      if (filled.length === 0) {
        toast({ title: "Add a competitor", description: "Or turn on auto-find and we'll pick three for you.", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      const filled = competitors.filter((c) => c.trim().length > 0);
      const result = await api.startAnalysis(
        {
          productLink: productLink.trim() || undefined,
          productName: productName.trim() || undefined,
          category,
          priceMin: pMin,
          priceMax: pMax,
          platform,
          competitors: filled,
          autoFind,
        },
        token!,
      );
      toast({
        title: "Reading the reviews…",
        description: "We're reading every review and cross-checking what people say online. Usually takes about a minute.",
      });
      openResults(result.runId);
    } catch (e: any) {
      toast({ title: "Couldn't start", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ambient">
      <header className="border-b border-border bg-card/30 backdrop-blur sticky top-0 z-30">
        <div className="px-5 md:px-10 py-3.5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goDashboard} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ClarifyAI" width={28} height={28} />
            <span className="font-display font-semibold text-sm hidden md:block">ClarifyAI</span>
          </div>
        </div>
      </header>

      <main className="px-5 md:px-10 py-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            What should we read for you?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl">
            Paste your product and up to three competitors. We'll do the reading and bring you the truth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6 md:p-7">
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Field 1: Product link (optional) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Product link
                    <span className="text-xs text-muted-foreground font-normal">(optional — Amazon.in or Flipkart.com URL)</span>
                  </Label>
                  <Input
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B0CHX1W1XY"
                    className="text-base h-11"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    {productLink.trim()
                      ? "✓ We'll use this link directly — no search needed for your product."
                      : "No link? Just type the product name below and we'll search for it."}
                  </p>
                </div>

                {/* Field 2: Product name (required if no link) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <span className={`w-2 h-2 rounded-full ${productLink.trim() ? "bg-muted-foreground" : "bg-accent"}`} />
                    Product name
                    <span className="text-xs text-muted-foreground font-normal">
                      {productLink.trim() ? "(optional)" : "(required — since you didn't paste a link)"}
                    </span>
                  </Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 wireless headphones"
                    className="text-base h-11"
                  />
                </div>

                {/* Field 3: Category (required) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Category
                    <span className="text-xs text-muted-foreground font-normal">(required — helps us find similar competitors)</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Pick a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Field 4: Price range (required, in INR) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Price range
                    <span className="text-xs text-muted-foreground font-normal">(required — in ₹, helps filter out mismatched products)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Min"
                        type="text"
                        inputMode="numeric"
                        className="pl-7 h-11"
                      />
                    </div>
                    <span className="text-muted-foreground text-sm">to</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Max"
                        type="text"
                        inputMode="numeric"
                        className="pl-7 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Field 5: Platform (required, default both) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    Platform
                    <span className="text-xs text-muted-foreground font-normal">(where should we look?)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["amazon", "flipkart", "both"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`h-11 rounded-md border text-sm font-medium transition-all capitalize ${
                          platform === p
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-transparent text-muted-foreground hover:bg-card/50"
                        }`}
                      >
                        {p === "both" ? "Both" : p === "amazon" ? "Amazon" : "Flipkart"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 6: Competitors */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                      Competitors
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Find them for me</span>
                      <Switch checked={autoFind} onCheckedChange={setAutoFind} />
                    </div>
                  </div>

                  {autoFind ? (
                    <Card className="bg-accent/5 border-accent/30 border-dashed">
                      <CardContent className="py-4 flex items-start gap-3">
                        <Search className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">We'll find three competitors for you</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Using your product name, category, and price range — we'll search {platform === "both" ? "Amazon and Flipkart" : platform === "amazon" ? "Amazon" : "Flipkart"} for similar products in your price band, then verify each one is a genuine match before reading any reviews.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {competitors.map((c, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-2"
                        >
                          <Input
                            value={c}
                            onChange={(e) => updateCompetitor(idx, e.target.value)}
                            placeholder={`Competitor ${idx + 1} — link or name`}
                            className="h-11"
                          />
                          {competitors.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCompetitor(idx)}
                              className="h-11 w-11"
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
                          className="mt-1"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add another (up to 3)
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full glow-accent h-12 mt-2 text-base"
                >
                  {submitting ? (
                    "Starting up…"
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Read the reviews for me
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <TrustItem
            icon={<ShieldCheck className="w-4 h-4 text-success" />}
            title="Real reviews only"
            desc="Pulled from Amazon, Flipkart, Reddit, blogs"
          />
          <TrustItem
            icon={<Search className="w-4 h-4 text-accent" />}
            title="Verified competitors"
            desc="We confirm each match is genuinely comparable"
          />
          <TrustItem
            icon={<Zap className="w-4 h-4 text-info" />}
            title="Done in a minute"
            desc="No 400-tab marathon required"
          />
        </motion.div>
      </main>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/30 p-3 flex items-start gap-2.5">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
