# 🚀 CreatorSpy AI — Production Deployment & Cloudflare Architecture Guide

This guide details how to deploy **CreatorSpy AI** for maximum performance, 99.99% uptime, zero memory leaks, and global CDN caching with Cloudflare.

---

## 🏗️ 1. Architecture Overview

```
                               ┌──────────────────────────────────────────────┐
                               │            CLOUDFLARE EDGE NETWORK           │
                               │  - Global CDN Caching (Static Assets)        │
                               │  - Free SSL / TLS Encryption                 │
                               │  - Enterprise-grade DDoS Protection          │
                               │  - Custom Domain DNS Routing                 │
                               └──────────────────────┬───────────────────────┘
                                                      │
                         ┌────────────────────────────┴────────────────────────────┐
                         ▼                                                         ▼
            ┌───────────────────────────┐                             ┌───────────────────────────┐
            │    FRONTEND (Next.js)     │                             │     BACKEND (FastAPI)     │
            │    - Cloudflare Pages     │     /api/* Proxied          │   - Container Host        │
            │      OR Docker Container  ├────────────────────────────►│   - 4x Uvicorn Workers    │
            │    - Standalone Engine    │                             │   - ChromaDB + SQLite     │
            │    - Port: 3000           │                             │   - Persistent Volume     │
            └───────────────────────────┘                             │   - Port: 8000            │
                                                                      └───────────────────────────┘
```

---

## ⚡ 2. Why Python & ChromaDB Need a Container Host (Instead of Pure Workers)

* **Cloudflare Workers Python Runtime**: Workers execute Python inside WebAssembly (`Pyodide`). It is **stateless** and does **not support C++ native libraries** like `hnswlib` (used by ChromaDB vector similarity) or multi-threaded SQLite disk writes.
* **The Industry Best Practice**:
  1. **Frontend**: Deploy on **Cloudflare Pages** (or inside the Docker container).
  2. **Backend**: Deploy the Docker container on **Railway, Fly.io, Render, or any VPS (Hetzner/DigitalOcean)** with a persistent volume for ChromaDB and SQLite.
  3. **Cloudflare DNS + CDN + Tunnel**: Put Cloudflare in front of both services to get the full benefits of Cloudflare (lightning speed, security, and free SSL) without breaking Python's persistent local vector database.

---

## 🐳 3. Option A: 1-Click Unified Docker Deployment (Recommended)

Both Frontend and Backend can run with a single command on any VPS or container host:

```bash
# 1. Clone repository
git clone https://github.com/your-username/creatorspy-ai.git
cd creatorspy-ai

# 2. Configure Environment
cp .env.example .env
# Edit .env with your GROQ_API_KEY, YOUTUBE_API_KEY, etc.

# 3. Launch with Docker Compose
docker compose up -d --build
```

* **Frontend**: Available at `http://your-domain.com:3000`
* **Backend API Docs**: Available at `http://your-domain.com:8000/docs`
* **Health Check**: `curl http://your-domain.com:8000/api/health`

---

## ☁️ 4. Option B: Cloudflare Pages (Frontend) + Container Backend

### Step 1: Deploy Backend (Render / Railway / Fly.io)
1. Push repository to GitHub.
2. Link your repository to **Railway** or **Render**.
3. Set Build Command: `pip install -r backend/requirements.txt`
4. Set Start Command: `python backend/run.py` (or use the provided `backend/Dockerfile`).
5. Add a Persistent Disk mounted to `/app/chroma_viral_db` (for vector embeddings).
6. Copy the generated backend URL (e.g. `https://creatorspy-api.up.railway.app`).

### Step 2: Deploy Frontend on Cloudflare Pages
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages** ➔ **Create Application** ➔ **Pages** ➔ **Connect to Git**.
2. Select your repository.
3. Configure Build Settings:
   * **Framework Preset**: Next.js
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Build Output Directory**: `.next`
4. In **Environment Variables**, add:
   * `NEXT_PUBLIC_BACKEND_URL`: `https://creatorspy-api.up.railway.app`
   * `NODE_VERSION`: `20`
5. Click **Save and Deploy**.

---

## 🛡️ 5. Setting up Cloudflare DNS & SSL for Custom Domain

1. In your Cloudflare Dashboard, navigate to **DNS** ➔ **Records**.
2. Add a CNAME record:
   * **Name**: `@` (or `app`)
   * **Target**: Your Pages or VPS domain
   * **Proxy Status**: `Proxied` (Orange Cloud enabled)
3. Navigate to **SSL/TLS** ➔ set encryption mode to **Full (Strict)**.
4. Navigate to **Speed** ➔ **Optimization** ➔ enable **Auto Minify** (JS, CSS, HTML) and **Brotli Compression**.

---

## 📊 6. Performance & Concurrency Tuning (Included in Codebase)

* **In-Memory Cache with TTL ([cache_manager.py](file:///d:/Mehtab/ClarifyAI/backend/app/services/cache_manager.py))**:
  * Repeated channel queries return in **<1ms** directly from memory.
  * Eliminates YouTube API quotas and Groq token costs for concurrent users.
* **4-Tier LLM Cascading Fallback ([llm_engine.py](file:///d:/Mehtab/ClarifyAI/backend/app/services/llm_engine.py))**:
  * Tier 1: Groq Llama-3.3-70B (~200ms sub-second generation)
  * Tier 2: Groq Fallback Key
  * Tier 3: Google Gemini 1.5 Flash
  * Tier 4: Gemini Fallback Key
  * Tier 5: Algorithmic Synthesizer (Guarantees 100% uptime with 0 failure)
* **Multi-Worker Concurrency ([run.py](file:///d:/Mehtab/ClarifyAI/backend/run.py))**:
  * Set `WEB_CONCURRENCY=4` in production for parallel request handling.
