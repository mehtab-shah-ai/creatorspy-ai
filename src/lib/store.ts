"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "intel-auth" },
  ),
);

type View = "auth" | "dashboard" | "new-analysis" | "results";

interface UIState {
  view: View;
  activeRunId: string | null;
  setView: (v: View) => void;
  openResults: (runId: string) => void;
  goDashboard: () => void;
  goNewAnalysis: () => void;
}

export const useUI = create<UIState>((set) => ({
  view: "auth",
  activeRunId: null,
  setView: (v) => set({ view: v }),
  openResults: (runId) => set({ view: "results", activeRunId: runId }),
  goDashboard: () => set({ view: "dashboard" }),
  goNewAnalysis: () => set({ view: "new-analysis" }),
}));
