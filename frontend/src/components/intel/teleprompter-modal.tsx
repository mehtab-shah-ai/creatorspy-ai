"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Gauge, Pause, Play, RotateCcw, Type, X } from "lucide-react";
import { DirectorScriptRow } from "@/lib/types";

interface TeleprompterModalProps { isOpen: boolean; onClose: () => void; scriptRows: DirectorScriptRow[]; videoTitle: string; }

export function TeleprompterModal({ isOpen, onClose, scriptRows, videoTitle }: TeleprompterModalProps) {
  const [playing, setPlaying] = useState(false); const [speed, setSpeed] = useState(2); const [fontSize, setFontSize] = useState(31); const feed = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => { if (feed.current) feed.current.scrollTop += speed; }, 28); return () => window.clearInterval(timer); }, [playing, speed]);
  if (!isOpen) return null;
  const reset = () => { setPlaying(false); if (feed.current) feed.current.scrollTop = 0; };

  return <div className="fixed inset-0 z-[80] flex flex-col bg-[#050610]/[.985] text-white backdrop-blur-3xl">
    <header className="flex flex-col gap-4 border-b border-white/[.08] bg-[#0d1021]/90 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#777fff]/[.14] text-[#b4b9ff]"><Clapperboard className="h-4 w-4" /></span><div><p className="font-mono text-[9px] font-bold tracking-[.15em] text-[#9ca4ff]">DIRECTOR TELEPROMPTER</p><h2 className="mt-0.5 max-w-[400px] truncate text-xs font-bold text-[#ebedfb]">{videoTitle}</h2></div></div>
      <div className="flex flex-wrap items-center gap-2"><button onClick={() => setPlaying(!playing)} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${playing ? "bg-[#f16c98] text-white" : "bg-[#8af2c9] text-[#071411]"}`}>{playing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{playing ? "Pause" : "Start"}</button><button onClick={reset} title="Reset to top" className="grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] bg-white/[.05] text-[#b8c0db] hover:bg-white/[.1]"><RotateCcw className="h-3.5 w-3.5" /></button><Control icon={<Gauge className="h-3.5 w-3.5 text-[#a5acff]" />} label="Speed" value={`${speed}×`}><input type="range" min="1" max="6" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-14 accent-[#8088ff]" /></Control><Control icon={<Type className="h-3.5 w-3.5 text-[#78e4f5]" />} label="Type" value={`${fontSize}px`}><input type="range" min="20" max="44" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-14 accent-[#43d7ed]" /></Control><button onClick={onClose} title="Close teleprompter" className="grid h-8 w-8 place-items-center rounded-lg text-[#8993b4] hover:bg-[#f36d94]/10 hover:text-[#ffa1bd]"><X className="h-4 w-4" /></button></div>
    </header>
    <div className="relative flex-1 overflow-hidden"><div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-[#050610] to-transparent" /><div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-[#050610] to-transparent" />
      <div ref={feed} className="mx-auto h-full max-w-5xl overflow-y-auto px-5 py-28 text-center sm:px-16"><p className="font-mono text-[10px] tracking-[.26em] text-[#66708f]">— START RECORDING —</p><div className="mt-20 space-y-20">{scriptRows.map((row, i) => <section key={`${row.timestamp}-${i}`} className="border-b border-white/[.07] pb-16"><div className="flex flex-wrap items-center justify-center gap-2"><span className="rounded-md border border-[#7c85ff]/30 bg-[#727aff]/10 px-2 py-1 font-mono text-[10px] font-bold text-[#b5baff]">{row.timestamp}</span><span className="rounded-full bg-white/[.05] px-3 py-1 text-[10px] font-semibold text-[#aeb7d5]">CAMERA · {row.camera_direction}</span></div><p style={{ fontSize }} className="mx-auto mt-7 max-w-4xl font-display font-bold leading-[1.35] tracking-[-.035em] text-white">“{row.dialogue}”</p><div className="mt-6 flex flex-wrap justify-center gap-2 text-[10px] font-mono"><span className="rounded bg-[#f36c98]/10 px-2 py-1 text-[#ffa1bd]">TEXT · {row.on_screen_text}</span><span className="rounded bg-[#3cd8ef]/10 px-2 py-1 text-[#84ebf8]">SFX · {row.sound_fx}</span></div></section>)}</div><p className="pb-24 pt-12 font-mono text-[10px] tracking-[.26em] text-[#66708f]">— CUT &amp; WRAP —</p></div>
    </div>
  </div>;
}
function Control({ icon, label, value, children }: { icon: React.ReactNode; label: string; value: string; children: React.ReactNode }) { return <div className="hidden items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.035] px-2 py-1.5 text-[10px] sm:flex">{icon}<span className="text-[#8993b1]">{label}</span>{children}<b className="font-mono text-[#d2d6ff]">{value}</b></div>; }
