import type {
  AnalysisResultDTO,
  RunStatusDTO,
  RunMetricsDTO,
} from "@/lib/types";

const API_BASE = "/api";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export interface HistoryRun {
  runId: string;
  status: string;
  currentNode: string | null;
  progress: number;
  yourProductInput: string;
  totalCost: number;
  totalLatencyMs: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  productCount: number;
}

export const api = {
  async register(email: string, password: string, name?: string) {
    const r = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Registration failed");
    return data as { user: { id: string; email: string; name?: string }; token: string };
  },

  async login(email: string, password: string) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Login failed");
    return data as { user: { id: string; email: string; name?: string }; token: string };
  },

  async startAnalysis(
    body: { yourProduct: string; competitors: string[]; autoFind: boolean },
    token: string,
  ) {
    const r = await fetch(`${API_BASE}/analysis/start`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Failed to start analysis");
    return data as { runId: string; status: string; demoMode: boolean };
  },

  async getHistory(token: string): Promise<HistoryRun[]> {
    const r = await fetch(`${API_BASE}/analysis/history`, { headers: authHeaders(token) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Failed to fetch history");
    return data.runs;
  },

  async getStatus(runId: string, token: string): Promise<RunStatusDTO & { recentNodes: any[] }> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/status`, { headers: authHeaders(token) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },

  async getResult(runId: string, token: string): Promise<AnalysisResultDTO> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/result`, { headers: authHeaders(token) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },

  async getMetrics(runId: string, token: string): Promise<RunMetricsDTO> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/metrics`, { headers: authHeaders(token) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },
};
