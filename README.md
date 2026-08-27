# ClarifyAI — AI-Powered Competitive Intelligence Platform

> Paste a product link and we'll read every review, cross-check it against Reddit and blogs, and tell you exactly what people love, what they wish was better, and where you can win — side by side with your competitors.

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (single page)                    │
│  Auth · Dashboard · New Analysis · Results  (view switching)     │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP polling (/api/analysis/[runId]/status)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Next.js API Routes                          │
│  /api/auth/{register,login}    /api/analysis/{start, history}    │
│  /api/analysis/[runId]/{status, result, metrics}                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                  LangGraph.js State Machine                       │
│                                                                   │
│  START                                                            │
│   ↓                                                               │
│  1. inputValidator     ← parse link/name, extract ASIN            │
│   ↓                                                               │
│  2. competitorResolver ← Serper → Tavily fallback                 │
│   ↓                                                               │
│  3. scraper            ← Apify + Firecrawl×2 (parallel fan-out)  │
│   │   ├─ Cache check (48h TTL via SQLite)                        │
│   │   ├─ Apify: 400 reviews + price/rating                       │
│   │   ├─ Firecrawl #1: Reddit threads                            │
│   │   └─ Firecrawl #2: Blog/YouTube (independent source)         │
│   ↓                                                               │
│  4. clustering         ← HF embeddings + cosine similarity        │
│   ↓                                                               │
│  5. aspectLabeling     ← Groq batches of 10-15 (forced JSON)     │
│   ↓                                                               │
│  6. aggregation        ← pure code, deterministic                │
│   ↓                                                               │
│  7. crossSourceVerification ← marketplace vs organic mismatch     │
│   ↓                                                               │
│  8. insightSynthesis   ← ONE Gemini call (stronger model)        │
│   ↓                                                               │
│  9. selfVerification   ← re-check claims vs aggregated table     │
│   ↓                                                               │
│  10. costLogger        ← persist everything to SQLite             │
│   ↓                                                               │
│  END                                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SQLite (via Prisma ORM)                        │
│  User · AnalysisRun · Product · ReviewCluster                    │
│  CrossSourceFlag · Insight · NodeLog                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer              | Choice                                                |
|--------------------|-------------------------------------------------------|
| Framework          | Next.js 16 (App Router) + TypeScript                  |
| Styling            | Tailwind CSS 4 + shadcn/ui + custom design tokens    |
| Animations         | Framer Motion                                         |
| Charts             | Recharts                                              |
| State               | Zustand (client) + TanStack Query (server)            |
| Database           | SQLite via Prisma ORM                                |
| Agent orchestration | LangGraph.js (StateGraph, nodes, edges)              |
| Tool wrappers      | LangChain core                                        |
| Auth               | bcryptjs (hashing) + jose (JWT)                      |

### External Services (all free-tier compatible)

| Service     | Purpose                                       | Env var                |
|-------------|-----------------------------------------------|------------------------|
| Apify       | Structured Amazon review scraping (400 max)   | `APIFY_API_TOKEN`      |
| Serper      | Google Shopping for competitor auto-discovery | `SERPER_API_KEY`       |
| Tavily      | Fallback search when Serper is rate-limited   | `TAVILY_API_KEY`       |
| Firecrawl ×2 | Independent Reddit + blog crawling           | `FIRECRAWL_API_KEY_1`  |
|             |                                                | `FIRECRAWL_API_KEY_2`  |
| HuggingFace | Embeddings (sentence-transformers/all-MiniLM-L6-v2) | `HF_API_TOKEN`    |
| Groq        | Cheap/fast model for aspect labeling (Llama)  | `GROQ_API_KEY`         |
| Gemini      | Stronger model for single insight synthesis   | `GEMINI_API_KEY`       |

---

## Demo Mode

If any of the above API keys are missing, the pipeline degrades gracefully and runs end-to-end with deterministic synthetic data. The UI surfaces a "DEMO MODE" banner so the user is never misled about which data is real vs synthetic. This means the entire UX is explorable without paying a cent.

---

## Cost & Latency Control (built into the architecture)

- **Model routing**: Groq (cheap) for many small aspect-labeling calls. Gemini (stronger) used for ONE final synthesis call only. Never the other way around.
- **Parallelism**: All per-product scraping runs concurrently via `Promise.all`. Clustering + labeling also fan out in parallel.
- **Caching**: SQLite-backed 48h TTL keyed on ASIN. Hit before any scrape.
- **Token budgeting**: Review batches capped at 10–15 per LLM call. Total reviews per product capped at 400.
- **Per-node telemetry**: Every node logs cost ($) + latency (ms) + status + metadata to `NodeLog` table → feeds the frontend cost panel.

---

## Worst-Case Handling (all 6 built-in + tested)

1. **Apify returns 0 reviews** → fall back to Firecrawl-only sentiment, mark data quality as `"limited"`.
2. **All scraping sources fail for one competitor** → still return comparison for the products that succeeded, clearly mark the failed one with `"limited"` quality and an error message.
3. **Groq times out or errors** → retry once, then fall back to Gemini for that specific call.
4. **Invalid/non-existent product link** → Input Validator catches this BEFORE any paid API calls happen, returns a clear error immediately.
5. **Rate limits hit mid-run** → exponential backoff with jitter (max 2 retries), then degrade gracefully rather than crash.
6. **Clustering produces only 1 giant cluster** → skip clustering, process as a single small batch instead of forcing artificial splits.

---

## Database Schema (7 models, SQLite only)

```
users(id, email, password_hash, name, created_at, updated_at)
analysis_runs(id, user_id, status, current_node, progress, your_product_input,
              competitor_inputs, auto_find, total_cost, total_latency_ms,
              error_message, created_at, completed_at)
products(id, run_id, source_url, platform, role[your_product|competitor],
         name, asin, price, currency, rating, review_count, raw_data_json,
         cached_until, data_quality, error_message)
review_clusters(id, product_id, aspect, sentiment, frequency,
                example_quotes_json, confidence, source_breakdown_json)
cross_source_flags(id, run_id, aspect, marketplace_sentiment,
                   organic_sentiment, disagreement_note, severity)
insights(id, run_id, verdict_text, confidence, opportunities_json, generated_at)
node_logs(id, run_id, node_name, cost, latency_ms, status, error_message, metadata_json)
```

---

## API Endpoints

| Method | Path                                       | Purpose                                  |
|--------|--------------------------------------------|------------------------------------------|
| POST   | `/api/auth/register`                       | Create account                           |
| POST   | `/api/auth/login`                          | Login, returns JWT                       |
| POST   | `/api/analysis/start`                      | Kick off graph async, returns `runId`    |
| GET    | `/api/analysis/history`                    | User's past runs                         |
| GET    | `/api/analysis/[runId]/status`             | Polling endpoint for live progress       |
| GET    | `/api/analysis/[runId]/result`             | Full structured report (when complete)   |
| GET    | `/api/analysis/[runId]/metrics`             | Cost/latency breakdown for dashboard     |

---

## Frontend Views (single-page app, view switching)

1. **Auth** — Login/Register with hero, floating orbs, demo-credentials button.
2. **Dashboard** — Stats strip (total runs, completed, total spend, avg latency) + history list with click-to-open.
3. **New Analysis** — Product input + competitor inputs + auto-find toggle + pipeline preview sidebar.
4. **Results** — Live progress tracker (animated node timeline, polling) → completion → side-by-side cards + aspect bar chart + top complaints (expandable quote cards) + cross-source callouts + opportunity cards + cost/latency panel.

### Design direction

- **Dark-mode-first** with warm dark slate background (NOT pure black, NOT blue-tinted).
- **Accent: amber/gold** (oklch 0.78 0.18 65) used sparingly — primary CTA, active states, key data.
- **Typography**: Space Grotesk for display headings (geometric, distinctive), Inter for body, JetBrains Mono for telemetry.
- **Generous whitespace**, clear visual hierarchy, Framer Motion stagger-in animations.

---

## Local Development

```bash
# Install dependencies
bun install

# Set up the database (SQLite, file-based)
bun run db:push

# Optional: add real API keys to .env to disable demo mode
cat >> .env << 'EOF'
GROQ_API_KEY=...
GEMINI_API_KEY=...
APIFY_API_TOKEN=...
SERPER_API_KEY=...
TAVILY_API_KEY=...
FIRECRAWL_API_KEY_1=...
FIRECRAWL_API_KEY_2=...
HF_API_TOKEN=...
JWT_SECRET=change-me-to-32-plus-random-chars
EOF

# Start the dev server (port 3000)
bun run dev
```

Open `http://localhost:3000` (or the preview URL if running in the sandbox).

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                            # Main view orchestrator
│   ├── layout.tsx                         # Fonts + globals
│   ├── globals.css                        # Custom design tokens (amber accent, dark-first)
│   └── api/
│       ├── auth/{register,login}/route.ts
│       └── analysis/
│           ├── start/route.ts
│           ├── history/route.ts
│           └── [runId]/
│               ├── status/route.ts
│               ├── result/route.ts
│               └── metrics/route.ts
├── components/
│   ├── ui/                                # shadcn/ui component set
│   └── intel/
│       ├── auth-view.tsx
│       ├── dashboard-view.tsx
│       ├── new-analysis-view.tsx
│       └── results-view.tsx
└── lib/
    ├── config.ts                          # Env-based config + demo-mode detection
    ├── auth.ts                            # bcrypt + JWT
    ├── cache.ts                           # 48h SQLite cache (keyed on ASIN)
    ├── retry.ts                           # Exponential backoff + timeout
    ├── types.ts                           # All shared domain types
    ├── api-client.ts                      # Frontend fetch helpers
    ├── store.ts                           # Zustand auth + UI store
    ├── db.ts                              # Prisma client
    ├── services/
    │   ├── apify.ts                       # Amazon review scraper (with mock fallback)
    │   ├── serper.ts                      # Google Shopping (with mock fallback)
    │   ├── tavily.ts                      # Search fallback (with mock fallback)
    │   ├── firecrawl.ts                   # Reddit/blog crawler, 2 accounts
    │   ├── groq.ts                        # Groq → Gemini fallback
    │   └── gemini.ts
    ├── agents/
    │   ├── tracker.ts                     # Per-node cost/latency tracker
    │   ├── input-validator.ts             # Node 1
    │   ├── competitor-resolver.ts         # Node 2
    │   ├── scraper.ts                     # Node 3 (parallel fan-out)
    │   ├── clustering.ts                  # HF embeddings + cosine sim
    │   ├── clustering-labeling.ts         # Nodes 4+5 combined
    │   ├── labeling.ts                    # Groq aspect labeler (with rule-based fallback)
    │   ├── aggregation.ts                 # Node 6 (pure code)
    │   ├── cross-source-verification.ts   # Node 7
    │   ├── insight-synthesis.ts           # Node 8 (Gemini single call)
    │   ├── self-verification.ts            # Node 9
    │   └── cost-logger.ts                 # Node 10 (persist to SQLite)
    └── graph/
        ├── state.ts                       # LangGraph Annotation.Root
        └── workflow.ts                   # The 11-node StateGraph wiring
```

---

## Deployment

The app is configured for `output: "standalone"` (see `next.config.ts`) which produces a self-contained bundle suitable for containerized deployment on AWS (ECS Fargate, App Runner, or Lambda via OpenNext).

### AWS Deployment Sketch

1. **Build**: `bun run build` → produces `.next/standalone/` directory.
2. **Container**: copy `standalone/`, `public/`, `.next/static/`, `prisma/`, and `db/` into a Node 20 container.
3. **Provision**:
   - ECS Fargate or App Runner for the Next.js server
   - EFS or EBS for SQLite persistence (or upgrade to RDS Postgres for HA)
4. **Environment variables**: set all `*_API_KEY` vars + `JWT_SECRET` + `DATABASE_URL`.
5. **Domain**: Route 53 → Application Load Balancer → Fargate service.

---

## What's Next (production hardening)

- **Streaming progress via SSE** instead of polling — would eliminate ~1.5s polling latency in the UI.
- **Per-user API key vault** so users can plug in their own Apify/Groq credentials (multi-tenant).
- **Redis** as cache layer for multi-instance deployments (currently SQLite = single instance).
- **Webhook notifications** when long-running analyses complete.
- **Export to PDF/CSV** for the comparison report.
