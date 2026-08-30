"use client";

import { Activity, ArrowUpRight, LogOut, Sparkles, Mic, Brain, Film, Compass, Flame, Play, Radar } from "lucide-react";
import { AuthUser } from "@/lib/types";

export type NavViewType = "landing" | "workspace" | "podcast_miner" | "hook_vault";

interface NavbarProps {
  currentView: NavViewType;
  onNavigateView: (view: NavViewType) => void;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({ currentView, onNavigateView, user, onOpenAuth, onLogout }: NavbarProps) {
  const navItems: { id: NavViewType; label: string; icon: any }[] = [
    { id: "landing", label: "Discover", icon: Compass },
    { id: "workspace", label: "Creator Studio", icon: Film },
    { id: "podcast_miner", label: "Podcast Viral Miner", icon: Mic },
    { id: "hook_vault", label: "Viral Hook Library", icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#070709]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Eye-Catching Modern Logo */}
        <button onClick={() => onNavigateView("landing")} className="group flex items-center gap-3 text-left cursor-pointer">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-400 p-[1.5px] shadow-md shadow-amber-500/20 transition-all group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-[#070709]">
              <Radar className="h-4.5 w-4.5 text-amber-400 transition-all group-hover:rotate-45" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-white">
              Creator<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300">Spy</span>
            </span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 font-mono text-[9px] font-black text-amber-300 tracking-wider">
              AI PRO
            </span>
          </div>
        </button>

        {/* Center Navigation - Every Item Has the Exact Same Single-Line Box Size as Discover */}
        <nav className="hidden items-center gap-2 md:flex shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateView(item.id)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-600 shadow-md ring-1 ring-white/10"
                    : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : "text-zinc-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden h-9 items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-emerald-300 font-mono text-[10px] font-bold whitespace-nowrap shrink-0 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            <span>REAL YOUTUBE DATA</span>
          </div>

          {user ? (
            <div className="flex h-9 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 whitespace-nowrap shrink-0">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 text-[11px] font-black text-zinc-950">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-zinc-200 sm:block">
                {user.name}
              </span>
              <button onClick={onLogout} title="Sign out" className="grid h-6 w-6 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button onClick={onOpenAuth} className="hidden h-9 items-center px-3 text-xs font-bold text-zinc-300 transition hover:text-white sm:flex whitespace-nowrap shrink-0 cursor-pointer">
                Sign in
              </button>
              <button onClick={onOpenAuth} className="flex h-9 items-center gap-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-xs hover:opacity-95 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap shrink-0 cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" /> Launch Studio
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
