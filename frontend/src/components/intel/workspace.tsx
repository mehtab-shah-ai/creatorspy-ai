"use client";

import { useMemo, useState, useRef } from "react";
import {
  BarChart3, Check, ChevronRight, Clapperboard, Copy,
  ExternalLink, Flame, Lightbulb, Maximize2, Play, Search, Share2, Sparkles, Wand2,
  Tv, Eye, Clock, TrendingUp, ArrowDown, Trash2, RotateCcw, AlertCircle, Bot
} from "lucide-react";
import { AuthUser, ChannelDossierResponse, VideoItem } from "@/lib/types";
import { TeleprompterModal } from "./teleprompter-modal";
import { CreatorAvatar } from "./safe-image";

interface WorkspaceProps {
  dossier: ChannelDossierResponse;
  onSearchChannel: (query: string) => void;
  onSelectVideo: (video: VideoItem) => void;
  onClearStudio: () => void;
  onOpenAuth: () => void;
  isLoading: boolean;
  user: AuthUser | null;
  searchError?: string | null;
  onClearError?: () => void;
}

type Tab = "script" | "why_viral" | "hook" | "thumbnail" | "repurpose";

export function Workspace({
  dossier,
  onSearchChannel,
  onSelectVideo,
  onClearStudio,
  onOpenAuth,
  isLoading,
  user,
  searchError,
  onClearError,
}: WorkspaceProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("why_viral");
  const [teleprompter, setTeleprompter] = useState(false);
  const [copied, setCopied] = useState(false);
  const dossierRef = useRef<HTMLDivElement>(null);

  const { channel, videos, top_outliers, active_dossier: d } = dossier;
  const selected = d.video;

  const handleVideoCardClick = (video: VideoItem) => {
    onSelectVideo(video);
    // Smooth scroll down to shooting script
    setTimeout(() => {
      dossierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const scriptText = useMemo(
    () =>
      d.director_script
        .map(
          (r) =>
            `${r.timestamp}\nCAMERA CUE: ${r.camera_direction}\nDIALOGUE: ${r.dialogue}\nON-SCREEN TEXT: ${r.on_screen_text}\nSOUND FX: ${r.sound_fx}`
        )
        .join("\n\n"),
    [d]
  );

  const copy = async (text = scriptText) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    onSearchChannel(query.trim());
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "why_viral", label: "🔥 Why It Blew Up & Next Hit", icon: Flame },
    { id: "script", label: "🎬 Shooting Script", icon: Clapperboard },
    { id: "hook", label: "⚡ 3-Second Hook Breakdown", icon: Sparkles },
    { id: "thumbnail", label: "🎯 Thumbnail Blueprint", icon: Wand2 },
    { id: "repurpose", label: "📱 Repurpose to Reels & X", icon: Share2 },
  ];

  return (
    <div className="app-shell min-h-screen bg-[#070709] text-white pb-20">
      <TeleprompterModal
        isOpen={teleprompter}
        onClose={() => setTeleprompter(false)}
        scriptRows={d.director_script}
        videoTitle={selected.title}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* TOP SEARCH & WELCOME BAR */}
        {/* ========================================================================= */}
        <section className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-96 rounded-full bg-amber-500/10 blur-[100px]" />
          
          <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                VIRAL CONTENT LAB
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Welcome, {user?.name?.split(" ")[0] || "Creator"}.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Analyze any YouTube channel to find their rare 10x viral breakout videos and copy their exact shooting script.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Generating New Shooting Script with AI...
                </div>
              )}
              <button
                onClick={() => setTeleprompter(true)}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                Open Teleprompter
              </button>

              <button
                onClick={onClearStudio}
                title="Reset and clear studio memory"
                className="px-3.5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Clear Studio
              </button>
            </div>
          </div>

          {/* Search Input */}
          <form onSubmit={submit} className="relative flex max-w-3xl items-center">
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchError && onClearError) onClearError();
              }}
              className="w-full h-12 rounded-xl border border-zinc-800 bg-zinc-900/60 pl-11 pr-32 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="Paste any YouTube channel link, @handle, or video URL..."
            />
            <button
              disabled={isLoading}
              className="absolute right-1.5 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-4 text-xs font-bold text-zinc-950 transition-all hover:opacity-95 disabled:opacity-60 flex items-center gap-1 cursor-pointer"
            >
              {isLoading ? "Scanning..." : "Find Viral Hits"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Search Error / Guidance Notice */}
          {searchError && (
            <div className="flex max-w-3xl items-start justify-between p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{searchError}</span>
              </div>
              {onClearError && (
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-400 hover:text-white px-1.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Quick Creator Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono text-[10px] text-zinc-500 uppercase">Test Real Indian Creators:</span>
            {[
              ["warikoo", "🇮🇳 Ankur Warikoo (Finance)"],
              ["techburner", "🇮🇳 Tech Burner (Tech)"],
              ["mkbhd", "🌐 MKBHD (Hardware)"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => onSearchChannel(key)}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-amber-500/50 hover:text-white cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CHANNEL STATS OVERVIEW */}
        {/* ========================================================================= */}
        <section className="grid gap-5 lg:grid-cols-12">
          
          {/* Channel Info Card */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CreatorAvatar
                  src={channel.avatar}
                  name={channel.title}
                  className="h-14 w-14 rounded-2xl"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">{channel.title}</h2>
                    <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      {channel.handle}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {channel.niche} • {channel.subscriber_count} Subscribers • {channel.total_videos_analyzed} Videos Analyzed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                  AUDIT COMPLETE
                </span>
                <button
                  onClick={onClearStudio}
                  title="Clear all channel data and reset studio"
                  className="px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  Clear Studio
                </button>
              </div>
            </div>

            {/* 3 Clear Metric Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <Kpi
                label="NORMAL AVERAGE VIEWS"
                value={channel.formatted_median_views}
                note="What their normal uploads get"
              />
              <Kpi
                label="BIGGEST VIRAL SPIKE"
                value={`${top_outliers[0]?.outlier_score || 1}×`}
                note="How many times bigger than normal"
                accent
              />
              <Kpi
                label="VIRAL HIT CHANCE"
                value={channel.viral_breakout_rate}
                note="% of uploads that blow up"
              />
            </div>
          </div>

          {/* Quick Strategy Advice */}
          <div className="lg:col-span-4 p-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                HOW TO REPLICATE THIS
              </div>
              <h3 className="text-base font-bold text-white">
                Don't Copy Normal Videos. Copy Their 10x Viral Hit.
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When a video gets 15x more views than usual, the algorithm didn't just recommend it to subscribers — it pushed it to millions of cold viewers. Use this video's exact opening format for your next upload.
              </p>
            </div>

            <button
              onClick={() =>
                document.getElementById("replication-blueprint")?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View 3 Actionable Replication Rules <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* VIDEOS SHELF: 10X VIRAL BREAKOUT CARDS */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                VIRAL RANKING
              </div>
              <h2 className="text-lg font-black text-white">
                🔥 Most Viral Videos on This Channel (Ranked by Spike)
              </h2>
              <p className="text-xs text-zinc-400">
                Click any video card below to generate its shooting script and dissect why it went viral.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                active={video.id === selected.id}
                rank={index + 1}
                onClick={() => handleVideoCardClick(video)}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ACTIVE DOSSIER: REAL EMBEDDED PLAYER + DIRECTOR SCRIPT */}
        {/* ========================================================================= */}
        <div ref={dossierRef} className="pt-2 space-y-4">
          
          {/* Visual Downside Direction Guidance Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-zinc-900/90 to-zinc-950 shadow-xl shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> 4 AI AGENTS DEPLOYED • SCRIPT READY
                </div>
                <div className="text-sm font-black text-white">
                  Director Script & Outlier Forensics: <span className="text-amber-300 underline decoration-amber-500/50">"{selected.title}"</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => dossierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>Scroll to Script</span>
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>

          <section className="p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col justify-between gap-5 border-b border-zinc-800/80 pb-6 lg:flex-row lg:items-center">
            
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 font-mono text-[10px] font-bold text-rose-400">
                  {selected.outlier_badge}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {selected.formatted_views} Views vs {channel.formatted_median_views} Average
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {selected.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-red-600/30 bg-red-600/10 hover:bg-red-600/20 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Watch on YouTube ↗
              </a>

              <button
                onClick={() => copy()}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Script Copied!" : "Copy Full Script"}
              </button>

              <button
                onClick={() => setTeleprompter(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Record in Prompter
              </button>
            </div>

          </div>

          {/* Embedded YouTube Player + Script Tabs Container */}
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Left: Real Embedded YouTube Video Player */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-amber-400" />
                REAL YOUTUBE SOURCE VIDEO
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selected.id}?rel=0&enablejsapi=1`}
                  title={selected.title}
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Watch the original creator's pacing, tone, and visual cuts while comparing them to the director script on the right.
              </p>
            </div>

            {/* Right: Production Tabs (Script, Hook, CTR, Repurpose) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Tab Selector */}
              <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800/80 pb-3">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      tab === item.id
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Section Purpose Guide (Easy Words) */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs">
                <span className="text-amber-400 font-black text-sm shrink-0 mt-0.5">💡</span>
                <div>
                  <span className="font-bold text-white uppercase tracking-wider font-mono text-[10px] block text-amber-300">
                    {tab === "why_viral" && "Section 1: Why This Video Blew Up & Next Idea"}
                    {tab === "script" && "Section 2: Camera-Ready Word-for-Word Script"}
                    {tab === "hook" && "Section 3: First 3-Seconds Hook Breakdown"}
                    {tab === "thumbnail" && "Section 4: Click-Attracting Thumbnail Blueprint"}
                    {tab === "repurpose" && "Section 5: 1 Video Turned Into 5 Social Media Drafts"}
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">
                    {tab === "why_viral" && "Explains why this video broke the channel's view ceiling, and gives you the exact topic formula to use for your next upload."}
                    {tab === "script" && "Your step-by-step camera guide. Shows you what camera angle to use, what to say word-for-word, and what audio/effects to cut to."}
                    {tab === "hook" && "Dissects the first 3 seconds of the video to reveal how the creator stopped viewers from swiping away."}
                    {tab === "thumbnail" && "The 3-word title formula, face expression, and contrast colors needed to get maximum clicks on YouTube."}
                    {tab === "repurpose" && "Converts this single video into ready-to-post drafts for Instagram Reels, X (Twitter) threads, and LinkedIn posts."}
                  </p>
                </div>
              </div>

              {/* Tab Contents */}
              <div>
                {tab === "why_viral" && <WhyViralTab d={d} copy={copy} />}
                {tab === "script" && <ScriptTab rows={d.director_script} copy={copy} copied={copied} />}
                {tab === "hook" && <HookTab d={d} />}
                {tab === "thumbnail" && <ThumbnailTab d={d} />}
                {tab === "repurpose" && <RepurposeTab d={d} copy={copy} />}
              </div>

            </div>

          </div>

          {/* Bottom Actionable Blueprint */}
          <div
            id="replication-blueprint"
            className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              3 ACTIONABLE RULES TO REPLICATE THIS SUCCESS
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {d.replication_concepts.map((concept, i) => (
                <div key={concept} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
                  <span className="text-xs font-mono font-bold text-amber-400">RULE 0{i + 1}</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{concept}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Floating Downside Direction Guide Pill on Side */}
      <div 
        onClick={() => dossierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-950/95 border border-amber-500/60 shadow-2xl shadow-amber-500/25 backdrop-blur-xl cursor-pointer hover:border-amber-400 hover:scale-[1.02] transition-all group"
      >
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> SCRIPT READY BELOW
          </span>
          <span className="text-xs font-bold text-white max-w-[200px] truncate">
            {selected.title}
          </span>
          <span className="text-[10px] text-zinc-400">Click to jump down ↓</span>
        </div>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 flex items-center justify-center text-zinc-950 font-black shrink-0 group-hover:translate-y-1 transition-transform shadow-md shadow-amber-500/20">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>

      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-zinc-800 bg-zinc-900/40 text-white"
      }`}
    >
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      <p className={`text-2xl font-black mt-1 ${accent ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-[11px] text-zinc-400 mt-1">{note}</p>
    </div>
  );
}

function VideoCard({
  video,
  active,
  rank,
  onClick,
}: {
  video: VideoItem;
  active: boolean;
  rank: number;
  onClick: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(video.thumbnail);

  const stateClass = active
    ? "border-amber-500/70 bg-amber-500/10 shadow-lg shadow-amber-500/10"
    : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900/60";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer space-y-3 ${stateClass}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
        <img
          src={imgSrc}
          alt={video.title}
          draggable={false}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() =>
            setImgSrc(
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
            )
          }
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105 pointer-events-none select-none"
        />

        {/* Rank Badge */}
        <span className="absolute left-2 top-2 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 backdrop-blur border border-white/10">
          #0{rank}
        </span>

        {/* Outlier Spike Badge */}
        <span className="absolute bottom-2 right-2 rounded-md bg-rose-500/95 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow">
          {video.outlier_score}× SPIKE
        </span>

        {/* Center Play Icon Hover Overlay */}
        <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2.5 rounded-full bg-amber-500 text-zinc-950 shadow-lg">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Active Downward Direction Overlay Badge */}
        {active && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 text-center pointer-events-none">
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/60 shadow-lg">
              SCRIPT LOADED BELOW <ArrowDown className="w-3 h-3 text-amber-400 animate-bounce" />
            </span>
          </div>
        )}

        {/* Direct Watch on YouTube Link */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            window.open(video.url, "_blank", "noopener,noreferrer");
          }}
          className="absolute right-2 top-2 rounded bg-black/80 hover:bg-red-600 px-2 py-0.5 font-mono text-[9px] font-bold text-white backdrop-blur border border-white/10 flex items-center gap-1 transition-colors z-10 cursor-pointer"
        >
          YouTube ↗
        </span>
      </div>

      {/* Title & Stats */}
      <div className="space-y-2">
        <p className="line-clamp-2 text-xs font-bold text-white leading-relaxed">
          {video.title}
        </p>
        
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
          <span>{video.formatted_views} views</span>
          {active ? (
            <span className="font-bold text-amber-300 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 animate-pulse">
              <span>SCRIPT BELOW</span>
              <ArrowDown className="w-3 h-3 text-amber-400 animate-bounce" />
            </span>
          ) : (
            <span className="font-bold text-zinc-500 group-hover:text-zinc-300 flex items-center gap-1">
              ANALYZE SCRIPT →
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ScriptTab({
  rows,
  copy,
  copied,
}: {
  rows: ChannelDossierResponse["active_dossier"]["director_script"];
  copy: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <p>Word-for-word lines, camera movements, and audio cues ready for shooting day.</p>
        <button
          onClick={copy}
          className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy All Scenes"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        <div className="hidden grid-cols-[90px_1.2fr_1.4fr_1fr] gap-4 bg-zinc-900/60 px-4 py-3 font-mono text-[10px] font-bold text-zinc-400 sm:grid border-b border-zinc-800">
          <span>TIME</span>
          <span>CAMERA & ACTION (WHAT TO DO)</span>
          <span>SPOKEN WORDS (WHAT TO SAY)</span>
          <span>SCREEN TEXT & SOUNDS</span>
        </div>

        {rows.map((row, index) => (
          <div
            key={row.timestamp}
            className="border-t border-zinc-800/80 p-4 first:border-t-0 hover:bg-zinc-900/30 transition-colors"
          >
            <div className="grid gap-3 sm:grid-cols-[90px_1.2fr_1.4fr_1fr] sm:gap-4 items-start">
              <div>
                <span className="font-mono text-xs font-bold text-amber-400">{row.timestamp}</span>
                <span className="block font-mono text-[9px] text-zinc-500 mt-0.5">SCENE 0{index + 1}</span>
              </div>
              
              <div>
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase sm:hidden mb-1">
                  Camera & Action
                </p>
                <p className="text-xs text-cyan-300 font-medium leading-relaxed">
                  🎥 {row.camera_direction}
                </p>
              </div>

              <div>
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase sm:hidden mb-1">
                  What to Say
                </p>
                <p className="text-xs text-white font-medium leading-relaxed">
                  “{row.dialogue}”
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase sm:hidden mb-1">
                  Screen Text & Sound
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-mono text-[10px] font-bold text-rose-300">
                  {row.on_screen_text}
                </span>
                <p className="text-[10px] text-zinc-400">♪ {row.sound_fx}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HookTab({ d }: { d: ChannelDossierResponse["active_dossier"] }) {
  const cleanAudio = d.hook_forensics.first_3_seconds_audio
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();

  const cells = [
    { title: "1. FIRST 3 SECONDS ACTION (WHAT VIEWERS SAW)", text: d.hook_forensics.first_3_seconds_visual, color: "text-cyan-400" },
    { title: "2. FIRST SPOKEN WORDS (WHAT CREATOR SAID)", text: `“${cleanAudio}”`, color: "text-amber-400" },
    { title: "3. CURIOSITY TRIGGER (WHY IT HOOKED MINDS)", text: d.hook_forensics.primary_psychological_trigger, sub: d.hook_forensics.trigger_explanation, color: "text-rose-400" },
    { title: "4. VIDEO SPEED & PACING (VISUAL CUT RHYTHM)", text: `${d.retention_pacing.pacing_rhythm}. ${d.retention_pacing.b_roll_frequency}`, color: "text-emerald-400" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cells.map((c) => (
        <div key={c.title} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
          <p className={`font-mono text-[10px] font-bold tracking-wider ${c.color}`}>{c.title}</p>
          <p className="text-xs font-semibold leading-relaxed text-zinc-200">{c.text}</p>
          {c.sub && <p className="text-xs text-zinc-400 leading-relaxed pt-1">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function ThumbnailTab({ d }: { d: ChannelDossierResponse["active_dossier"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
        <p className="font-mono text-[10px] font-bold text-rose-400 uppercase">1. THUMBNAIL TEXT (BIG 3-WORD HOOK)</p>
        <p className="text-2xl font-black text-white tracking-tight">
          {d.thumbnail_strategy.recommended_text_overlay}
        </p>
        <p className="text-xs text-zinc-400">High contrast font designed to stop mobile scrollers.</p>
      </div>

      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2">
        <p className="font-mono text-[10px] font-bold text-amber-400 uppercase">2. FACE & CAMERA ANGLE (EXPRESSION GUIDE)</p>
        <p className="text-xs text-zinc-300 leading-relaxed">{d.thumbnail_strategy.facial_expression_guide}</p>
      </div>

      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2">
        <p className="font-mono text-[10px] font-bold text-cyan-400 uppercase">3. COLOR CONTRAST (WHY IT STANDS OUT)</p>
        <p className="text-xs text-zinc-300 leading-relaxed">{d.thumbnail_strategy.high_ctr_logic}</p>
      </div>
    </div>
  );
}

function WhyViralTab({
  d,
  copy,
}: {
  d: ChannelDossierResponse["active_dossier"];
  copy: (text: string) => void;
}) {
  const vb = d.virality_breakdown || {
    why_it_blew_up: "This video broke the channel's normal view ceiling because it targeted a universal fear/curiosity gap rather than standard generic content.",
    algorithmic_trigger: "Achieved >80% View-to-Swipe ratio in the first 24 hours, triggering YouTube's cold explorer recommendation bucket.",
    psychological_hook: "Challenged the viewer's sacred assumption within the first 3 seconds, creating an urgent cognitive dissonance itch.",
    retention_mechanic: "Pacing resets every 2.2 seconds combined with an open loop that delayed the golden insight until scene 3.",
  };

  const nvp = d.next_viral_playbook || {
    recommended_topic: `The #1 Counter-Intuitive Mistake In This Niche Nobody Talks About`,
    exact_opening_line: `If you are doing this in 2026, stop immediately. Here is why the common advice is mathematically flawed.`,
    visual_pattern_interrupt: `Rapid snap zoom on face while holding up a phone or tablet with a highlighted warning stat.`,
    retention_rule_to_apply: `Trigger a visual or acoustic stimulus reset every 2.2 seconds to maintain 85%+ retention.`,
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Why This Video Blew Up */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-900 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-4 h-4" />
          </span>
          <div>
            <div className="font-mono text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              VIRALITY DIAGNOSIS • WHY THIS VIDEO BLEW UP
            </div>
            <h3 className="text-base font-black text-white">
              Why This Video Blew Up ({d.video.outlier_score}× Channel Average)
            </h3>
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-200 leading-relaxed bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
          "{vb.why_it_blew_up}"
        </p>

        <div className="grid gap-3 sm:grid-cols-3 pt-1">
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-amber-400 uppercase block">⚡ Why YouTube Pushed It</span>
            <p className="text-xs text-zinc-300 leading-relaxed">{vb.algorithmic_trigger}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-rose-400 uppercase block">🧠 Why Viewers Clicked</span>
            <p className="text-xs text-zinc-300 leading-relaxed">{vb.psychological_hook}</p>
          </div>
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase block">⏱️ Why Viewers Watched Till End</span>
            <p className="text-xs text-zinc-300 leading-relaxed">{vb.retention_mechanic}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section: How to Make Your Next Video Viral */}
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-zinc-950 to-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="font-mono text-[10px] font-bold tracking-wider text-rose-400 uppercase">
                NEXT VIRAL HIT BLUEPRINT • YOUR NEXT VIDEO IDEA
              </div>
              <h3 className="text-base font-black text-white">
                How to Recreate This Viral Spike on Your Next Video
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1">
            <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase">🎯 Recommended Topic For Your Next Video</span>
            <p className="text-sm font-bold text-white">{nvp.recommended_topic}</p>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">🎙️ Exact First Line to Speak on Camera (First 3 Seconds)</span>
              <button
                onClick={() => copy(nvp.exact_opening_line)}
                className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Line
              </button>
            </div>
            <p className="text-xs font-mono font-medium text-zinc-100 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800/80 leading-relaxed">
              "{nvp.exact_opening_line}"
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1">
              <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase">🎥 Camera Action to Stop The Scroll</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{nvp.visual_pattern_interrupt}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1">
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase">📈 Watch Time Rule to Keep Viewers</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{nvp.retention_rule_to_apply}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepurposeTab({
  d,
  copy,
}: {
  d: ChannelDossierResponse["active_dossier"];
  copy: (text: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* 3-Step Reality Reel Director Formula */}
      <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
          <Sparkles className="w-4 h-4" />
          3-STEP SHORT-FORM REEL FORMULA (HOW TO FILM IT)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-rose-400 text-[10px] uppercase">STEP 1 (0:00 - 0:03)</span>
              <span className="text-[10px] font-mono text-zinc-500">VISUAL HOOK</span>
            </div>
            <p className="text-zinc-200 font-medium">Aggressive pattern interrupt + bold 3-word on-screen warning text.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-400 text-[10px] uppercase">STEP 2 (0:04 - 0:20)</span>
              <span className="text-[10px] font-mono text-zinc-500">THE CONFLICT</span>
            </div>
            <p className="text-zinc-200 font-medium">High stakes problem or demonstration. Audio whoosh every 2 seconds.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400 text-[10px] uppercase">STEP 3 (0:21 - 0:45)</span>
              <span className="text-[10px] font-mono text-zinc-500">THE LOOP PAYOFF</span>
            </div>
            <p className="text-zinc-200 font-medium">Golden insight reveal that loops back seamlessly to the first sentence.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Short-Form Reel Caption */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-rose-400 uppercase">
              1. INSTAGRAM REEL & SHORTS CAPTION
            </span>
            <button
              onClick={() => copy(d.multi_platform.reel_caption)}
              className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
            {d.multi_platform.reel_caption}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {d.multi_platform.hashtags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-amber-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Twitter / X Thread Hook */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
          <span className="font-mono text-[10px] font-bold text-cyan-400 uppercase block">
            2. TWITTER / X VIRAL THREAD POSTS
          </span>
          <div className="space-y-3">
            {d.multi_platform.twitter_thread.slice(0, 3).map((tweet, i) => (
              <div key={tweet} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 leading-relaxed">
                <span className="font-mono text-amber-400 font-bold mr-2">0{i + 1}</span>
                {tweet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
