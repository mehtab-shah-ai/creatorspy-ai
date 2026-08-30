"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  Flame,
  Layers3,
  LineChart,
  Play,
  Radar,
  ScanSearch,
  Sparkles,
  TimerReset,
  Wand2,
  XCircle,
  CheckCircle2,
  Bot,
  Cpu,
  Network,
} from "lucide-react";
import { SampleCreatorCard } from "@/lib/types";

interface LandingPageProps {
  onTriggerAuthOrStudio: () => void;
  onSelectBenchmark: (benchmarkId: string) => void;
  onExploreDemo: () => void;
  sampleCreators: SampleCreatorCard[];
}

export function LandingPage({
  onTriggerAuthOrStudio,
  onSelectBenchmark,
  onExploreDemo,
}: LandingPageProps) {
  const openStudio = () => {
    onExploreDemo();
  };

  return (
    <div className="app-shell relative overflow-hidden bg-[#070709] text-white min-h-screen">
      {/* Sleek Modern Dark Grid Pattern - Clearly Visible Lines */}
      <div 
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_85%_70%_at_50%_20%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.075) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.075) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Hero Ambient Gradients */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-10 top-20 h-[350px] w-[350px] rounded-full bg-rose-500/10 blur-[120px]" />

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8 pt-4 sm:pt-8">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              4 Autonomous Agents • Built For Video Creators
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[2.5rem] font-black tracking-tight leading-[1.2] text-white">
              You Upload 10 Videos. Only 1 Goes Viral.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400">
                Understand Why Before You Create Again.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              Stop wasting 8 hours filming videos that get stuck at 200 views. <span className="text-amber-300 font-bold">CreatorSpy Autonomous Multi-Agents</span> analyze any YouTube channel, reveal the exact 3-second hook that made their #1 video explode, and give you a word-for-word camera script with a teleprompter so you never freeze on camera.
            </p>

            {/* Smart AI Team Strip - Easy Words */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { name: "Viral Video Finder", task: "Finds 10x Hit Videos", dot: "bg-amber-400", border: "border-amber-500/30 bg-amber-500/5 text-amber-300" },
                { name: "3-Sec Hook Maker", task: "Stops Viewers Swiping", dot: "bg-rose-400", border: "border-rose-500/30 bg-rose-500/5 text-rose-300" },
                { name: "Camera Script Writer", task: "Word-by-Word Lines", dot: "bg-cyan-400", border: "border-cyan-500/30 bg-cyan-500/5 text-cyan-300" },
                { name: "Shorts & Reel Maker", task: "Makes 60s Viral Clips", dot: "bg-emerald-400", border: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" },
              ].map((agent, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border ${agent.border} text-left transition-all hover:bg-zinc-900/60`}>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <span className={`h-1.5 w-1.5 rounded-full ${agent.dot}`} />
                    <span>{agent.name}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-200 mt-0.5 truncate">{agent.task}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onTriggerAuthOrStudio}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Scan Any YouTube Channel <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={openStudio}
                className="px-5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 text-zinc-200 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                Explore Live Demo
              </button>
            </div>

            {/* Micro Benefits */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Finds 10x Viral Breakouts
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Exact 3-Second Opening Hook
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Ready-to-Shoot Camera Script
              </span>
            </div>
          </div>

          {/* Right: LMplot Growth Simulator - 300 Views Flatline vs 14M Viral Growth */}
          <div className="lg:col-span-5 relative group">
            {/* Theme Lighting Halo Glow behind Card - Soft Ambient Tone */}
            <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-amber-500/10 blur-xl opacity-60" />
            <div className="pointer-events-none absolute -top-6 -right-6 h-36 w-36 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-rose-500/10 blur-3xl" />

            {/* Card Container */}
            <div className="relative p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_0_40px_-15px_rgba(245,158,11,0.15)] space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <LineChart className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Viral Video Growth Simulator</div>
                    <div className="text-[10px] text-zinc-400 font-mono uppercase">BEFORE: 300 VIEWS ➔ AFTER: 14M VIRAL GROWTH</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  REAL GROWTH DATA
                </span>
              </div>

              {/* Side-by-Side LMplot Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* BEFORE: Stuck at 300 Views (Low Scatter Points & Flat Line) */}
                <div className="p-3.5 rounded-xl border border-zinc-800/90 bg-zinc-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-zinc-800/90 border border-zinc-700 font-mono text-[9px] font-bold text-rose-400 uppercase">
                      ❌ BEFORE (WITHOUT HOOK)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase">CHANNEL TRAJECTORY</span>
                    <span className="text-base font-bold text-zinc-300">~300 Views <span className="text-[10px] font-normal text-zinc-500">(Flatline)</span></span>
                  </div>

                  {/* SVG Low LM-plot */}
                  <div className="relative h-24 rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-1 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 220 110" className="w-full h-full">
                      <defs>
                        <linearGradient id="flatline-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="10" y1="25" x2="210" y2="25" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="10" y1="55" x2="210" y2="55" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="10" y1="85" x2="210" y2="85" stroke="#3f3f46" strokeDasharray="2 2" strokeWidth="1" />
                      
                      {/* Gradient fill below flatline */}
                      <polygon points="10,88 210,88 210,105 10,105" fill="url(#flatline-fill)" />

                      {/* Flat Linear Regression Line */}
                      <line x1="10" y1="88" x2="210" y2="88" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />

                      {/* Low scatter points clustering around 300 views */}
                      <circle cx="22" cy="85" r="3" fill="#71717a" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="50" cy="91" r="3" fill="#71717a" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="80" cy="84" r="3" fill="#f43f5e" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="110" cy="89" r="3" fill="#71717a" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="140" cy="86" r="3" fill="#71717a" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="170" cy="90" r="3" fill="#f43f5e" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="198" cy="87" r="3" fill="#71717a" stroke="#18181b" strokeWidth="1.5" />

                      {/* Floating tag */}
                      <rect x="130" y="62" width="75" height="17" rx="4" fill="#18181b" stroke="#3f3f46" />
                      <text x="167" y="74" fill="#a1a1aa" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        300 VIEWS
                      </text>
                    </svg>
                  </div>

                  <div className="pt-1 text-[10px] text-zinc-400 space-y-1 border-t border-zinc-800/60">
                    <div className="flex justify-between items-center">
                      <span>Retention:</span>
                      <span className="text-rose-400 font-mono font-medium">24% (68% swiped)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Algorithm:</span>
                      <span className="text-zinc-500 font-medium truncate max-w-[120px]">Killed in 24 hours</span>
                    </div>
                  </div>
                </div>

                {/* AFTER: 14 Million Views (Growth Scatter Points & Steep Curve) */}
                <div className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-zinc-950/80 to-zinc-900/40 space-y-2.5 relative overflow-hidden shadow-lg shadow-amber-500/5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-[9px] font-bold text-amber-300 uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      AFTER (VIRAL BREAKOUT)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400/90 block uppercase">VIRAL TRAJECTORY</span>
                    <span className="text-base font-black text-amber-300">14,200,000 Views <span className="text-[10px] font-normal text-amber-400/80">🚀</span></span>
                  </div>

                  {/* SVG Exponential Growth LM-plot */}
                  <div className="relative h-24 rounded-lg bg-zinc-950/90 border border-amber-500/30 p-1 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 220 110" className="w-full h-full">
                      <defs>
                        <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="growth-line-grad" x1="0" y1="1" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="50%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="10" y1="25" x2="210" y2="25" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="10" y1="55" x2="210" y2="55" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="10" y1="85" x2="210" y2="85" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />

                      {/* Area Fill */}
                      <path d="M 10 92 Q 85 86 125 50 T 210 14 L 210 105 L 10 105 Z" fill="url(#growth-fill)" />

                      {/* Exponential Growth Trend Line */}
                      <path d="M 10 92 Q 85 86 125 50 T 210 14" fill="none" stroke="url(#growth-line-grad)" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Scatter Points along the steep surge */}
                      <circle cx="20" cy="91" r="3" fill="#f59e0b" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="55" cy="85" r="3" fill="#f59e0b" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="95" cy="71" r="3.5" fill="#fb923c" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="135" cy="45" r="3.5" fill="#f97316" stroke="#18181b" strokeWidth="1.5" />
                      <circle cx="175" cy="26" r="4" fill="#f43f5e" stroke="#18181b" strokeWidth="1.5" />
                      
                      {/* Peak 14M Beacon */}
                      <circle cx="208" cy="14" r="7" fill="#f43f5e" fillOpacity="0.3" className="animate-pulse" />
                      <circle cx="208" cy="14" r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />

                      {/* 14M Tag */}
                      <rect x="125" y="5" width="80" height="17" rx="4" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1" />
                      <text x="165" y="17" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        🔥 14M+ VIEWS
                      </text>
                    </svg>
                  </div>

                  <div className="pt-1 text-[10px] space-y-1 border-t border-zinc-800/60">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Retention:</span>
                      <span className="text-emerald-400 font-mono font-bold">91% (Hooked at 0:03)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Algorithm:</span>
                      <span className="text-amber-300 font-medium truncate max-w-[120px]">Browse Push to Cold Feed</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Instant Trust Takeaway Note */}
              <div className="text-[11px] text-zinc-200 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 leading-relaxed flex items-start gap-2.5">
                <span className="text-amber-400 text-sm leading-none mt-0.5 shrink-0">💡</span>
                <div>
                  <strong className="text-white font-semibold">The Algorithm Secret: </strong>
                  <span className="text-zinc-300">
                    Videos don't fail because of their topic — they die at 300 views when viewers swipe away in 2 seconds. A 3-second pattern interrupt keeps retention above 85%, triggering YouTube to push your video to 14 Million views.
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
                <div className="text-left max-w-[210px]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">READY TO RECORD?</div>
                  <div className="text-xs font-bold text-white truncate">Turn 300 Views Into 14M Views</div>
                </div>
                <button
                  onClick={openStudio}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
                >
                  Get Viral Script <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* STORYTELLING: THE BRUTAL PROBLEM VS HOW CREATORSPY SOLVES IT */}
        {/* ========================================================================= */}
        <section className="mt-20 pt-12 border-t border-zinc-900 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Why 95% of Creators Fail on YouTube
            </h2>
            <p className="text-sm text-zinc-400">
              You do not have an "editing" problem or an "algorithm" problem. Here is what actually happens every time you post:
            </p>
          </div>

          {/* 3 Problems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">1. The 3-Second Swipe Trap</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                68% of viewers swipe away before second 4. If your opening doesn't have a visual pattern interrupt and a curiosity gap, the algorithm kills the video instantly.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">2. Copying the Wrong Videos</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You see a competitor with 400K views and copy it — without knowing their average is 1M views! You just copied a flop. You only want to copy genuine 10x outliers.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">3. The Blank Camera Freeze</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You sit down to record and freeze. ChatGPT gives you a boring essay instead of an actual director's shot list telling you what to say and what B-roll to cut to.
              </p>
            </div>

          </div>

          {/* The Solution Banner - 4 Autonomous Agents */}
          <div className="p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-900 text-left space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  YOUR 24/7 AUTONOMOUS PRODUCTION TEAM
                </span>
              </div>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white">
                4 Autonomous Agents Working As Your Personal Video Production Team
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl border border-amber-500/30 bg-zinc-950/80 space-y-2 relative overflow-hidden group hover:border-amber-500/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-amber-400">1. VIRAL VIDEO FINDER</div>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <div className="text-sm font-bold text-white">Finds 10x Hit Videos</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scans any YouTube channel to find the exact breakout videos that got 10x more views than their normal uploads.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-rose-500/30 bg-zinc-950/80 space-y-2 relative overflow-hidden group hover:border-rose-500/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-rose-400">2. 3-SECOND HOOK MAKER</div>
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                </div>
                <div className="text-sm font-bold text-white">Stops Viewers Swiping</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Reveals the exact opening words, curiosity gap, and camera movement that stops people from scrolling away.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-cyan-500/30 bg-zinc-950/80 space-y-2 relative overflow-hidden group hover:border-cyan-500/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-cyan-400">3. CAMERA SCRIPT WRITER</div>
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                </div>
                <div className="text-sm font-bold text-white">Word-for-Word Script</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Writes your exact lines to speak, camera angles, on-screen text, and sound effects ready to shoot.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-zinc-950/80 space-y-2 relative overflow-hidden group hover:border-emerald-500/60 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-emerald-400">4. SHORTS & REEL MAKER</div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-sm font-bold text-white">Makes 60-Sec Clips</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Listens to long 1-2 hour podcasts and cuts out the best 45-60 second viral reels ready to post immediately.
                </p>
              </div>

            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="mt-20 p-8 sm:p-12 rounded-2xl border border-zinc-800 bg-zinc-950 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Stop Guessing. Start Creating Videos That Win.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Paste any competitor channel handle or a long podcast. Get a production-ready shooting kit in under 5 seconds.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={onTriggerAuthOrStudio}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Open Creator Studio <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={openStudio}
              className="px-5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-200 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              Watch Live Demo
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-14 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div>CreatorSpy AI • Autonomous Algorithmic Video Intelligence Engine</div>
          <div className="flex gap-4">
            <span>Deterministic Outlier Math</span>
            <span>ChromaDB Vector Vault</span>
            <span>Podcast Growth Miner</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
