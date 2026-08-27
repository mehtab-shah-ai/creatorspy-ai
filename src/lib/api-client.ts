import type {
  AnalysisResultDTO,
  RunStatusDTO,
  RunMetricsDTO,
} from "@/lib/types";

const API_BASE = "/api";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

/**
 * Safe JSON parser — when the dev server is down or crashes, the proxy returns
 * an HTML error page (<!DOCTYPE html>...) which causes r.json() to throw
 * "Unexpected token '<'". This helper catches that and throws a friendlier
 * message so the user sees "Server is starting up..." instead of a cryptic
 * JSON parse error.
 */
async function safeJson(r: Response): Promise<any> {
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    // HTML response = server is down or crashed
    if (text.trim().startsWith("<!") || text.trim().startsWith("<html") || text.trim().startsWith("<HTML")) {
      throw new Error("Server is starting up — please wait a few seconds and try again.");
    }
    throw new Error("Unexpected response from server. Please try again.");
  }
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
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Registration failed");
    return data as { user: { id: string; email: string; name?: string }; token: string };
  },

  async login(email: string, password: string) {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Login failed");
    return data as { user: { id: string; email: string; name?: string }; token: string };
  },

  async startAnalysis(
    body: {
      productLink?: string;
      productName?: string;
      category: string;
      priceMin: number;
      priceMax: number;
      platform: "amazon" | "flipkart" | "both";
      competitors: string[];
      autoFind: boolean;
    },
    token: string,
  ) {
    const r = await fetch(`${API_BASE}/analysis/start`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Failed to start analysis");
    return data as { runId: string; status: string; demoMode: boolean };
  },

  async getHistory(token: string): Promise<HistoryRun[]> {
    const r = await fetch(`${API_BASE}/analysis/history`, { headers: authHeaders(token) });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Failed to fetch history");
    return data.runs;
  },

  async getStatus(runId: string, token: string): Promise<RunStatusDTO & { recentNodes: any[] }> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/status`, { headers: authHeaders(token) });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },

  async getResult(runId: string, token: string): Promise<AnalysisResultDTO> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/result`, { headers: authHeaders(token) });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },

  async getMetrics(runId: string, token: string): Promise<RunMetricsDTO> {
    const r = await fetch(`${API_BASE}/analysis/${runId}/metrics`, { headers: authHeaders(token) });
    const data = await safeJson(r);
    if (!r.ok) throw new Error(data.error ?? "Failed");
    return data;
  },
};
