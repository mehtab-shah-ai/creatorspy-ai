"use client";

import React, { useState, useEffect } from "react";
import { HookVaultItem, AdaptedHookResponse, AuthUser } from "@/lib/types";
import { searchHookVault, adaptHookForCreator } from "@/lib/api-client";
import {
  Sparkles,
  Search,
  Flame,
  Brain,
  Zap,
  Check,
  Copy,
  ArrowRight,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";

interface HookVaultProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export function HookVault({ user, onOpenAuth }: HookVaultProps) {
  const [hooks, setHooks] = useState<HookVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedNiche, setSelectedNiche] = useState("All");

  // Adapt Modal State
  const [activeHookForAdapt, setActiveHookForAdapt] = useState<HookVaultItem | null>(null);
  const [userNicheInput, setUserNicheInput] = useState("Tech & SaaS");
  const [userTopicInput, setUserTopicInput] = useState("Learning Next.js vs Using AI Tools");
  const [adapting, setAdapting] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState<AdaptedHookResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = ["All", "Curiosity Gap", "Contrarian", "Effort Invalidation", "FOMO", "Shock"];
  const niches = ["All", "Tech", "Finance", "Fitness", "AI & Coding", "Business", "Productivity"];

  useEffect(() => {
    loadHooks();
  }, [selectedCategory, selectedNiche]);

  const loadHooks = async () => {
    setLoading(true);
    try {
      const res = await searchHookVault(searchQuery, selectedCategory, selectedNiche);
      setHooks(res.hooks);
    } catch (err) {
      console.error("Hook vault search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHooks();
  };

  const [adaptError, setAdaptError] = useState<string | null>(null);

  const handleAdapt = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!activeHookForAdapt) return;
    setAdapting(true);
    setAdaptError(null);
    try {
      const res = await adaptHookForCreator(activeHookForAdapt.id, userNicheInput, userTopicInput);
      setAdaptedResult(res);
    } catch (err: any) {
      console.error("Adapt error:", err);
      setAdaptError(err?.message || "Failed to generate adapted shooting package. Please try again.");
    } finally {
      setAdapting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            PROVEN 3-SECOND OPENINGS • 100M+ VIEWS ANALYZED
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Viral <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400">Opening Hook Library</span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400">
            A curated collection of proven 3-second opening lines used by top creators to stop viewers from scrolling away. Pick any formula and use it for your video in 1 click.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opening hooks by topic or feeling (e.g. 'mistake', 'money', 'AI', 'fitness')..."
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 transition-all text-sm"
            />
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              Find Hooks
            </button>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Emotions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-semibold mr-1">Emotion:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-cyan-500/20 border border-cyan-500 text-cyan-300"
                      : "bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Niches */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-semibold mr-1">Niche:</span>
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedNiche === niche
                      ? "bg-amber-500/20 border border-amber-500 text-amber-300"
                      : "bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hooks Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-zinc-400">Searching proven opening hooks...</div>
          </div>
        ) : hooks.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
            <div className="text-base text-zinc-300 font-semibold mb-1">No matching hooks found</div>
            <div className="text-xs text-zinc-500">Try adjusting your search query or switching emotion filters</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hooks.map((hook) => (
              <div
                key={hook.id}
                className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold border border-zinc-800 bg-zinc-950 text-cyan-300">
                      {hook.emotion_category}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      {hook.retention_rate} Retention
                    </span>
                  </div>

                  {/* Hook Text */}
                  <div className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    "{hook.hook_text}"
                  </div>

                  {/* Creator Tag & Psychology */}
                  <div className="space-y-2 text-xs">
                    <div className="text-zinc-400">
                      <span className="text-zinc-500 font-semibold">Attribution:</span> {hook.creator_attribution} ({hook.niche})
                    </div>
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-300 leading-relaxed">
                      <span className="text-amber-400 font-bold block mb-0.5">🧠 Psychological Trigger:</span>
                      {hook.psychology_breakdown}
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                      return;
                    }
                    setActiveHookForAdapt(hook);
                    setAdaptedResult(null);
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-500 hover:text-zinc-950 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Adapt Framework to My Channel
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Adapt Framework Modal */}
        {activeHookForAdapt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-6 shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  Adapt Viral Framework
                </div>
                <button
                  onClick={() => setActiveHookForAdapt(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source Hook Snapshot */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-1 text-xs">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider block">
                  Original Framework ({activeHookForAdapt.emotion_category})
                </span>
                <p className="text-zinc-200 font-medium italic">
                  "{activeHookForAdapt.hook_text}"
                </p>
              </div>

              {/* User Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 font-semibold block mb-1.5">
                    Your Channel Niche:
                  </label>
                  <input
                    type="text"
                    value={userNicheInput}
                    onChange={(e) => setUserNicheInput(e.target.value)}
                    placeholder="e.g. Real Estate, Fitness, Coding"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-semibold block mb-1.5">
                    Your Specific Video Topic:
                  </label>
                  <input
                    type="text"
                    value={userTopicInput}
                    onChange={(e) => setUserTopicInput(e.target.value)}
                    placeholder="e.g. Buying flat vs Renting"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleAdapt}
                disabled={adapting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {adapting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Generating Customized Script...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-zinc-950" />
                    Generate Adapted Shooting Package ⚡
                  </>
                )}
              </button>

              {/* Error Alert if any */}
              {adaptError && (
                <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{adaptError}</span>
                </div>
              )}

              {/* Adapted Result */}
              {adaptedResult && (
                <div className="p-5 rounded-xl border border-amber-500/30 bg-zinc-900/80 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                      Predicted Retention: {adaptedResult.predicted_retention_score ?? 93}%
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(adaptedResult, null, 2))}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy JSON
                    </button>
                  </div>

                  {/* Adapted Spoken Line */}
                  <div>
                    <span className="text-zinc-400 text-xs font-semibold block mb-1">
                      🗣️ Your Adapted Opening Hook (0-3s):
                    </span>
                    <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm font-bold">
                      "{adaptedResult.adapted_hook_line || "Hook generated"}"
                    </div>
                  </div>

                  {/* Pattern Interrupt */}
                  <div>
                    <span className="text-zinc-400 text-xs font-semibold block mb-1">
                      👁️ Visual Pattern Interrupt:
                    </span>
                    <p className="text-xs text-zinc-300">
                      {adaptedResult.visual_pattern_interrupt || "Direct eye-level camera focus with fast zoom."}
                    </p>
                  </div>

                  {/* 3-Word Overlay */}
                  <div>
                    <span className="text-zinc-400 text-xs font-semibold block mb-1">
                      🖼️ 3-Word Thumbnail:
                    </span>
                    <div className="inline-block px-3 py-1 rounded bg-rose-500/20 text-rose-300 font-extrabold text-xs">
                      {adaptedResult.thumbnail_3_word_text || "WATCH THIS NOW"}
                    </div>
                  </div>

                  {/* Fast-Cut Script */}
                  <div className="space-y-2">
                    <span className="text-zinc-400 text-xs font-semibold block">
                      🎬 3-Scene Production Breakdown:
                    </span>
                    {(adaptedResult.fast_cut_script || []).map((row, rIdx) => (
                      <div key={rIdx} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                        <div className="font-mono text-amber-400 font-bold">{row.timestamp || `Scene ${rIdx + 1}`}</div>
                        <div className="text-zinc-300"><span className="text-zinc-500 font-semibold">Camera:</span> {row.camera || "Close-up"}</div>
                        <div className="text-zinc-200 italic font-medium"><span className="text-zinc-500 not-italic font-semibold">Say:</span> "{row.dialogue}"</div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
