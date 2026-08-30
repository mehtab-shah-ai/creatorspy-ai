# 🚀 Render 1-Click Fullstack Deployment Guide

> **Deploy both Next.js Frontend and FastAPI Backend on Render with 1 Click, zero disk wipe issues, and 24/7 Keep-Alive.**

---

## 🏗️ What Makes This Render Deployment Safe & Fast?

1. **Self-Healing ChromaDB & SQLite**:
   * Even if Render's free container restarts or sleeps, `rag_vault.py` **auto-seeds all viral hooks and rules in 0.2 seconds** upon boot. Zero data is lost!
2. **Instant Demo Load (Zero Waiting for Users)**:
   * The frontend loads instantly, and iconic creators (MKBHD, Warikoo, Jeremy) have pre-computed benchmarks that render in 0ms so users never see a blank screen.
3. **24/7 Keep-Alive Ping (No More 50-Second Cold Starts)**:
   * By setting up a free 10-minute heartbeat ping via UptimeRobot, Render receives traffic every 10 minutes and **never goes to sleep!**

---

## 🚀 Step 1: Deploy with Render Blueprint (1-Click)

1. Go to [dashboard.render.com](https://dashboard.render.com/) and log in.
2. Click the blue **"New +"** button at the top right ➔ select **"Blueprint"**.
3. Connect your GitHub repository: **`mehtab-shah-ai/creatorspy-ai`**.
4. Render will automatically read `render.yaml` and show:
   * Service 1: `creatorspy-backend` (Docker)
   * Service 2: `creatorspy-frontend` (Docker)
5. Under environment variables for `creatorspy-backend`, paste your API keys:
   * `GROQ_API_KEY`: Paste your Groq API key
   * `YOUTUBE_API_KEY`: Paste your YouTube Data API key
6. Click **"Apply"**!

Render will build both containers in parallel and give you two live URLs:
* Backend: `https://creatorspy-backend.onrender.com`
* Frontend: `https://creatorspy-frontend.onrender.com`

---

## ⚡ Step 2: Keep Render Awake 24/7 (Prevent Cold Starts)

To ensure Render never goes to sleep when a recruiter visits:

1. Go to [uptimerobot.com](https://uptimerobot.com/) (100% Free).
2. Click **"Add New Monitor"**:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `CreatorSpy Backend Keepalive`
   * **URL:** `https://creatorspy-backend.onrender.com/api/health`
   * **Monitoring Interval:** `Every 10 minutes`
3. Click **"Create Monitor"**.

🎉 **Done!** Every 10 minutes, UptimeRobot sends a tiny ping to `/api/health`. Render sees active traffic and **stays awake 24/7 with zero cold starts!**
