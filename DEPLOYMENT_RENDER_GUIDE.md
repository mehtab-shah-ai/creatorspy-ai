# 🚀 CreatorSpy AI — Render Deployment Guide

> **Deploy the Next.js Frontend as an Ultra-Fast Static Site (0ms Cold Start, Never Sleeps) and the FastAPI Backend as a Docker Container.**

---

## 🏗️ Architecture Overview

| Component | Platform | Runtime | Features |
| :--- | :--- | :--- | :--- |
| **Backend API** | Render Web Service | Docker (Python 3.12 + FastAPI) | Self-healing ChromaDB vector store, 4-tier LLM fallback, YouTube Data API v3 |
| **Frontend UI** | Render Static Site | Next.js Static HTML Export (`out/`) | **0ms cold start, never sleeps**, instant CDN delivery, dark obsidian aesthetic |

---

## 🚀 Part 1: Deploy Backend (Web Service)

1. Go to [dashboard.render.com](https://dashboard.render.com/) ➔ Click **"New +"** ➔ **"Web Service"**.
2. Connect your GitHub repository: `mehtab-shah-ai/creatorspy-ai`.
3. Configure settings:
   * **Name:** `creatorspy-backend`
   * **Language:** `Docker`
   * **Dockerfile Path:** `./backend/Dockerfile`
   * **Plan:** `Free ($0/month)`
4. Add Environment Variables (from `.env.example`):
   * `GROQ_API_KEY`: Your Groq Cloud API Key
   * `GROQ_API_KEY_FALLBACK`: Your Backup Groq Key
   * `GEMINI_API_KEY`: Your Google Gemini API Key
   * `GEMINI_API_KEY_FALLBACK`: Your Backup Gemini Key
   * `YOUTUBE_API_KEY`: Your YouTube Data API v3 Key
   * `SERPER_API_KEY`: Your Serper Search Key
   * `ENVIRONMENT`: `production`
   * `SECRET_KEY`: Any secure string
5. Click **"Deploy web service"**.
   * Live API will be at: `https://creatorspy-backend.onrender.com`
   * Test health: `https://creatorspy-backend.onrender.com/api/health`
   * Swagger docs: `https://creatorspy-backend.onrender.com/docs`

---

## ⚡ Part 2: Deploy Frontend (Static Site — 0ms Cold Start)

1. On Render, click **"New +"** ➔ **"Static Site"**.
2. Connect your GitHub repository: `mehtab-shah-ai/creatorspy-ai`.
3. Configure settings:
   * **Name:** `creatorspy-ai` (gives you `https://creatorspy-ai.onrender.com`)
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Publish Directory:** `out`
4. Click **"Create Static Site"**.
   * Deploys in ~20 seconds!
   * Serves instantly from Render's global CDN with zero cold starts!

---

## 🛡️ Part 3: Keep Backend Awake 24/7 (Prevent Render Sleep)

Render free backend instances spin down after 15 minutes of inactivity. Set up a free 10-minute heartbeat ping so your backend never sleeps:

1. Go to [uptimerobot.com](https://uptimerobot.com/) (100% Free).
2. Click **"Add New Monitor"**:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `CreatorSpy Backend Heartbeat`
   * **URL:** `https://creatorspy-backend.onrender.com/api/health`
   * **Monitoring Interval:** `Every 10 minutes`
3. Click **"Create Monitor"**.

🎉 **Done!** Render receives a heartbeat ping every 10 minutes, keeping your backend hot and ready 24/7 with zero lag for any visitor or recruiter!
