"use client";

import React, { useState } from "react";
import {
  PodcastMiningResponse,
  PodcastClipCandidate,
  AuthUser,
} from "@/lib/types";
import { minePodcastReel } from "@/lib/api-client";
import {
  Sparkles,
  Flame,
  Clock,
  Play,
  Copy,
  Check,
  Film,
  Zap,
  ArrowRight,
  Eye,
  Instagram,
  Compass,
} from "lucide-react";

interface PodcastMinerProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
}

export function PodcastMiner({ user, onOpenAuth }: PodcastMinerProps) {
  const [urlInput, setUrlInput] = useState("v-_d2e7x4KA");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);
  const [miningResult, setMiningResult] = useState<PodcastMiningResponse | null>(null);

  const samplePresets = [
    {
      label: "🎥 MKBHD (Camera Robot)",
      id: "v-_d2e7x4KA",
    },
    {
      label: "💰 Warikoo (Money Psychology)",
      id: "NGRI92fetH4",
    },
    {
      label: "🧠 Veritasium (Google Interview)",
      id: "dtp6bRe6x3U",
    },
  ];

  const handleMine = async (targetId?: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const idToUse = targetId || urlInput;
    if (!idToUse.trim()) return;
    setLoading(true);
    try {
      const res = await minePodcastReel(idToUse);
      setMiningResult(res);
      setSelectedClipIndex(0);
    } catch (err) {
      console.error("Mining error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeClip: PodcastClipCandidate | null =
    miningResult && miningResult.extracted_clips.length > 0
      ? miningResult.extracted_clips[selectedClipIndex]
      : null;

  return (
    <div className="min-h-screen bg-[#070709] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Transcript-First Podcast Viral Miner • Zero Video Download Delay
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Mine <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">10x Viral Growth Reels</span> from Any Long Podcast and Long Videos.
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400">
            Paste any 1–2 hour podcast or long YouTube video. Our 3-act narrative intelligence scans the timed transcript and extracts the golden 45–60s clip with zero cut-off mistakes.
          </p>
        </div>

        {/* Input Card */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste YouTube Podcast URL or Video ID (e.g. https://youtube.com/watch?v=...)"
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-colors text-sm"
              />
            </div>
            <button
              onClick={() => handleMine()}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Mining Narrative Arc...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-zinc-950" />
                  Extract Growth Clips ⚡
                </>
              )}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-500">Quick Test Demos:</span>
            {samplePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setUrlInput(preset.id);
                  handleMine(preset.id);
                }}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:border-amber-500/40 hover:bg-zinc-800/60 text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {miningResult && activeClip && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Podcast Overview Card */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-amber-400 font-semibold tracking-wider uppercase mb-1">
                  Ingested Long-Form Source
                </div>
                <div className="text-lg font-bold text-white">
                  {miningResult.source_video_title}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Host/Creator: <span className="text-zinc-200 font-medium">{miningResult.source_channel}</span> • Total Duration: {miningResult.total_podcast_duration}
                </div>
              </div>
              <div className="px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {miningResult.extracted_clips.length} Golden Narrative Clips Extracted
              </div>
            </div>

            {/* Clips Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {miningResult.extracted_clips.map((clip, idx) => {
                const isSelected = idx === selectedClipIndex;
                return (
                  <button
                    key={clip.id}
                    onClick={() => setSelectedClipIndex(idx)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                        : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-300">
                        Clip {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        {clip.virality_score}/100
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white line-clamp-1 mb-1">
                      {clip.title}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {clip.start_time} ➔ {clip.end_time} ({clip.duration_seconds}s)
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Clip Deep Dive */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Interactive Video Preview & Transcript */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Real YouTube Video Player Cued to Timestamp */}
                <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-black shadow-2xl">
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-amber-400" />
                      Live Cued at {activeClip.start_time}
                    </span>
                    <span className="text-zinc-400">
                      Duration: {activeClip.duration_seconds} Seconds
                    </span>
                  </div>
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${miningResult.source_video_id}?start=${activeClip.start_seconds}&autoplay=0&rel=0&enablejsapi=1`}
                      title={activeClip.title}
                      className="absolute inset-0 w-full h-full"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Word-For-Word Transcript Segment */}
                <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      Extracted Narrative Arc
                    </span>
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                      {activeClip.psychological_hook_type}
                    </span>
                  </div>
                  
                  {/* Spoken Hook Callout */}
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-200 text-sm italic font-medium">
                    {activeClip.hook_line}
                  </div>

                  {/* Full Text */}
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {activeClip.full_transcript_segment}
                  </p>
                </div>

                {/* Hollywood Cue Cards */}
                <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur space-y-4">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    🎬 Fast-Cut Video Direction & Sound FX
                  </div>
                  <div className="space-y-3">
                    {activeClip.director_cues.map((cue, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs"
                      >
                        <div className="sm:col-span-3 font-mono font-bold text-amber-400">
                          {cue.timestamp}
                        </div>
                        <div className="sm:col-span-5 text-zinc-300">
                          <span className="text-zinc-500 font-semibold block">🎥 Camera:</span>
                          {cue.camera}
                        </div>
                        <div className="sm:col-span-4 text-zinc-400">
                          <span className="text-zinc-500 font-semibold block">🔊 Sound FX:</span>
                          {cue.sound_fx}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Ready-To-Post Reel Assets */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Reel Assets Card */}
                <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="text-sm font-bold text-white">Instagram Reel & Short Package</span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${activeClip.reel_title}\n\n${activeClip.reel_caption}\n\n${activeClip.hashtags.join(" ")}`,
                          activeClip.id
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 hover:border-amber-400 text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === activeClip.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Package
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3-Word Overlay Title */}
                  <div>
                    <label className="text-xs text-zinc-400 font-semibold block mb-1">
                      Recommended 3-Word Overlay Text:
                    </label>
                    <div className="px-4 py-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-extrabold text-base tracking-wide">
                      {activeClip.reel_title}
                    </div>
                  </div>

                  {/* High-Retention Caption */}
                  <div>
                    <label className="text-xs text-zinc-400 font-semibold block mb-1">
                      Ready-to-Post Caption:
                    </label>
                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/80 text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                      {activeClip.reel_caption}
                    </div>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="text-xs text-zinc-400 font-semibold block mb-1.5">
                      Algorithmic Hashtags:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeClip.hashtags.map((ht, hIdx) => (
                        <span
                          key={hIdx}
                          className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-cyan-300 text-xs font-mono font-medium"
                        >
                          {ht}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Virality Guarantee Info Box */}
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5 text-xs">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Algorithmic Narrative Guarantee
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      This clip was chosen because the speech pattern moves from an immediate high-curiosity hook into an uninterrupted 30-second conflict, ending in a high-retention punchline without any mid-word cutoffs.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
