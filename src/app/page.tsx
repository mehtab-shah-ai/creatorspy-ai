"use client";

import { useEffect } from "react";
import { useAuth, useUI } from "@/lib/store";
import { AuthView } from "@/components/intel/auth-view";
import { DashboardView } from "@/components/intel/dashboard-view";
import { NewAnalysisView } from "@/components/intel/new-analysis-view";
import { ResultsView } from "@/components/intel/results-view";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { token } = useAuth();
  const { view, setView } = useUI();

  // If authenticated but stuck on auth view, send to dashboard.
  // If logged out, force auth view.
  useEffect(() => {
    if (token && view === "auth") setView("dashboard");
    if (!token && view !== "auth") setView("auth");
  }, [token, view, setView]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {view === "auth" && <AuthView />}
        {view === "dashboard" && token && <DashboardView />}
        {view === "new-analysis" && token && <NewAnalysisView />}
        {view === "results" && token && <ResultsView />}
      </motion.div>
    </AnimatePresence>
  );
}
