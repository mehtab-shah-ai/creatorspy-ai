"use client";

import { useState } from "react";
import { ArrowRight, AtSign, Check, Eye, LockKeyhole, Sparkles, X } from "lucide-react";
import { loginUser, registerUser } from "@/lib/api-client";
import { AuthUser } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await loginUser(email || "creator@clarifyai.io", password || "password123")
          : await registerUser(name || "Creator", email, password);
      onLoginSuccess(result.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We couldn't verify those details.");
    } finally {
      setLoading(false);
    }
  };

  const guest = () => {
    onLoginSuccess({
      id: "guest",
      email: "guest@creatorspy.ai",
      name: "Guest Creator",
      role: "creator",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#070709]/85 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative grid w-full max-w-[900px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c11] shadow-[0_32px_120px_rgba(0,0,0,0.8)] md:grid-cols-[0.9fr_1.1fr]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left Side: Brand Story & Value Proposition */}
        <aside className="relative hidden overflow-hidden border-r border-zinc-800 bg-zinc-950/80 p-8 sm:p-10 md:block">
          <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-amber-500/15 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-60 w-60 rounded-full bg-rose-500/10 blur-[80px]" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="h-3 w-3 text-amber-400" />
              FREE CREATOR STUDIO
            </div>

            <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
              Stop guessing what to record. Shoot videos that actually get views.
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-zinc-400">
              Find your competitor's most viral videos, see the exact words they spoke in the first 3 seconds, and get a word-for-word script ready to read on camera.
            </p>

            <div className="pt-4 space-y-3.5 border-t border-zinc-800/80">
              {[
                "Find videos that got 10x more views than usual",
                "Get the exact 3-second opening hook that stopped scrolling",
                "Full teleprompter so you never freeze on camera",
                "Turn 1-hour podcasts into viral Instagram reels",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3 text-xs text-zinc-300 font-medium">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Check className="h-3 w-3" />
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Form */}
        <section className="p-6 sm:p-10 bg-zinc-950/60 flex flex-col justify-center">
          <div className="mb-6">
            <span className="font-mono text-[11px] font-bold tracking-wider text-amber-400 uppercase">
              {mode === "login" ? "WELCOME BACK" : "CREATE YOUR STUDIO"}
            </span>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-white">
              {mode === "login" ? "Enter your creator studio" : "Start your CreatorSpy account"}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              {mode === "login"
                ? "Your saved dossiers and scripts are waiting."
                : "Free instant access. No credit card required."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium">
                {error}
              </p>
            )}

            {mode === "register" && (
              <Field
                icon={<Eye className="h-4 w-4" />}
                label="Creator or Channel Name"
                value={name}
                setValue={setName}
                placeholder="e.g. Harkirat Singh"
              />
            )}

            <Field
              icon={<AtSign className="h-4 w-4" />}
              label="Email address"
              type="email"
              value={email}
              setValue={setEmail}
              placeholder="you@creatorspy.ai"
            />

            <Field
              icon={<LockKeyhole className="h-4 w-4" />}
              label="Password"
              type="password"
              value={password}
              setValue={setPassword}
              placeholder="••••••••"
            />

            <button
              disabled={loading}
              type="submit"
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {loading
                ? "Opening your studio..."
                : mode === "login"
                ? "Sign in to CreatorSpy"
                : "Create Free Studio Account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-800" />
            <span className="font-mono text-[10px] text-zinc-500 font-bold">OR</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={guest}
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Explore Instant Demo (1-Click) <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
          </button>

          <p className="mt-6 text-center text-xs text-zinc-400">
            {mode === "login" ? "New to CreatorSpy?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-bold text-amber-400 hover:text-amber-300 cursor-pointer ml-1"
            >
              {mode === "login" ? "Create studio account" : "Sign in"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  type = "text",
  value,
  setValue,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-zinc-300">{label}</span>
      <span className="relative block">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          {icon}
        </span>
        <input
          required
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </span>
    </label>
  );
}
