"use client";

import React, { useState, useEffect } from "react";
import { Navbar, NavViewType } from "@/components/intel/navbar";
import { LandingPage } from "@/components/intel/landing-page";
import { Workspace } from "@/components/intel/workspace";
import { PodcastMiner } from "@/components/intel/podcast-miner";
import { HookVault } from "@/components/intel/hook-vault";
import { AuthModal } from "@/components/intel/auth-modal";
import {
  ChannelDossierResponse,
  SampleCreatorCard,
  VideoItem,
  AuthUser,
} from "@/lib/types";
import {
  fetchSampleCreators,
  fetchSampleDossier,
  analyzeChannel,
  deconstructVideo,
  clearStudioSession,
} from "@/lib/api-client";
import { Trash2, Sparkles, Search, ArrowRight, AlertCircle } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<NavViewType>("landing");
  const [sampleCreators, setSampleCreators] = useState<SampleCreatorCard[]>([]);
  const [activeDossier, setActiveDossier] = useState<ChannelDossierResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [cleanStudioQuery, setCleanStudioQuery] = useState<string>("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load sample creators on mount
  useEffect(() => {
    async function init() {
      try {
        const samples = await fetchSampleCreators();
        setSampleCreators(samples);

        // Preload real Indian creator benchmark by default
        const initialDossier = await fetchSampleDossier("warikoo");
        setActiveDossier(initialDossier);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  const handleSelectBenchmark = async (presetId: string) => {
    setIsLoading(true);
    try {
      const dossier = await fetchSampleDossier(presetId);
      setActiveDossier(dossier);
    } catch (err) {
      console.error("Failed to load benchmark:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAuthOrStudio = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setCurrentView("workspace");
    }
  };

  const handleExploreDemo = async () => {
    setIsLoading(true);
    try {
      const demoDossier = await fetchSampleDossier("warikoo");
      setActiveDossier(demoDossier);
      setCurrentView("workspace");
    } catch (err) {
      console.error("Failed to load demo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (u: AuthUser) => {
    setUser(u);
    setActiveDossier(null); // CRUCIAL: Clear preloaded demo (Warikoo) so logged in user gets 100% clean studio!
    setCurrentView("workspace");
  };

  const handleLogout = () => {
    setUser(null);
    // Reload public demo for guest viewing
    fetchSampleDossier("warikoo")
      .then((d) => setActiveDossier(d))
      .catch(() => setActiveDossier(null));
  };

  const handleSearchChannel = async (query: string) => {
    // If not logged in, ask for login/register!
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setSearchError(null);
    setIsLoading(true);
    try {
      const dossier = await analyzeChannel(query);
      setActiveDossier(dossier);
      setCurrentView("workspace");
    } catch (err: unknown) {
      console.error("Failed to analyze channel:", err);
      const msg = err instanceof Error ? err.message : "YouTube channel not found. Please provide a valid YouTube channel @handle (e.g. @warikoo, @mkbhd) or channel link.";
      setSearchError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVideo = async (video: VideoItem) => {
    if (!activeDossier) return;
    if (activeDossier.active_dossier.video.id === video.id) return;

    // Immediately switch the active video so the YouTube player and title update with 0 delay!
    setActiveDossier({
      ...activeDossier,
      active_dossier: {
        ...activeDossier.active_dossier,
        video: video,
      },
    });

    setIsLoading(true);
    try {
      const newDossier = await deconstructVideo(
        video.title,
        video.url,
        activeDossier.channel.niche,
        video.outlier_score
      );

      setActiveDossier((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          active_dossier: {
            ...newDossier,
            video: video, // MUST KEEP REAL VIDEO WITH REAL YOUTUBE ID & THUMBNAIL!
          },
        };
      });
    } catch (err) {
      console.error("Failed to deconstruct video:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStudio = async () => {
    setIsLoading(true);
    try {
      await clearStudioSession();
      setActiveDossier(null);
    } catch (err) {
      console.error("Failed to clear studio:", err);
      setActiveDossier(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col bg-[#070709]">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigateView={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Auth Modal (Sign In / Register / Guest Mode) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {currentView === "landing" ? (
          <LandingPage
            onTriggerAuthOrStudio={handleTriggerAuthOrStudio}
            onSelectBenchmark={handleSelectBenchmark}
            onExploreDemo={handleExploreDemo}
            sampleCreators={sampleCreators}
          />
        ) : currentView === "podcast_miner" ? (
          <PodcastMiner
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : currentView === "hook_vault" ? (
          <HookVault
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : activeDossier ? (
          <Workspace
            dossier={activeDossier}
            onSearchChannel={handleSearchChannel}
            onSelectVideo={handleSelectVideo}
            onClearStudio={handleClearStudio}
            onOpenAuth={() => setIsAuthOpen(true)}
            isLoading={isLoading}
            user={user}
            searchError={searchError}
            onClearError={() => setSearchError(null)}
          />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-spin">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
            </div>
            <p className="text-sm font-mono text-zinc-400">Loading Creator Intelligence Studio...</p>
          </div>
        ) : (
          /* Clean Studio Empty State */
          <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono font-bold uppercase">
                <Trash2 className="w-3.5 h-3.5" /> Studio Memory Cleared
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                Your Creator Studio is Fresh & Ready
              </h1>
              <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Enter any YouTube channel handle or video URL to discover their 10x viral breakout videos and generate word-for-word shooting scripts.
              </p>
            </div>

            {/* Search Error Notice */}
            {searchError && (
              <div className="mx-auto max-w-2xl text-left flex items-start justify-between p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs gap-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchError(null)}
                  className="text-rose-400 hover:text-white px-1.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Big Audit Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formInput = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value || "";
                const q = cleanStudioQuery.trim() || formInput.trim();
                if (q) {
                  handleSearchChannel(q);
                }
              }}
              className="relative flex max-w-2xl mx-auto items-center"
            >
              <input
                value={cleanStudioQuery}
                onChange={(e) => {
                  setCleanStudioQuery(e.target.value);
                  if (searchError) setSearchError(null);
                }}
                type="text"
                className="w-full h-14 rounded-2xl border border-zinc-800 bg-zinc-900/90 pl-5 pr-36 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none shadow-2xl transition-colors"
                placeholder="Paste channel link or @handle (e.g. @warikoo, @mkbhd)..."
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-5 text-xs font-bold text-zinc-950 hover:opacity-95 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? "Auditing..." : "Audit Channel ➔"}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <span className="text-xs font-mono text-zinc-500 uppercase">Or load an instant verified benchmark:</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  ["warikoo", "🇮🇳 Ankur Warikoo (Finance)"],
                  ["techburner", "🇮🇳 Tech Burner (Tech)"],
                  ["mkbhd", "🌐 MKBHD (Hardware)"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectBenchmark(key)}
                    className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/50 hover:text-white text-xs font-medium text-zinc-300 transition-all cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
