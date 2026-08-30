import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import settings
from .models import (
    ChannelDossierResponse,
    VideoDossier,
    AuthUser,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    PodcastMiningRequest,
    PodcastMiningResponse,
    HookSearchRequest,
    HookSearchResponse,
    AdaptHookRequest,
    AdaptedHookResponse,
)
from .sample_creators import SAMPLE_CREATORS
from .services.youtube import fetch_channel_intelligence
from .agents.orchestrator import deconstruct_video_agent
from .services.podcast_miner import mine_podcast_growth_reels
from .services.rag_vault import search_hook_vault, adapt_hook_for_creator
from .services.cache_manager import channel_cache, dossier_cache, hook_cache

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.1.0",
    description="CreatorSpy AI — Autonomous Viral Video Intelligence, Podcast Miner & Vector Hook Vault",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeChannelRequest(BaseModel):
    query: str

class DeconstructVideoRequest(BaseModel):
    title: str
    url: Optional[str] = ""
    niche: Optional[str] = "General Creator"
    views_multiplier: Optional[float] = 4.2

# In-memory user store for clean auth demo
USERS_DB: Dict[str, Dict[str, str]] = {
    "creator@creatorspy.ai": {
        "id": "usr_demo_1",
        "email": "creator@creatorspy.ai",
        "name": "Alex Vance (Creator)",
        "password": "password123",
        "role": "creator",
    }
}

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "youtube_api_active": bool(settings.YOUTUBE_API_KEY),
        "groq_active": bool(settings.GROQ_API_KEY),
        "groq_fallback_active": bool(settings.GROQ_API_KEY_FALLBACK),
        "gemini_active": bool(settings.GEMINI_API_KEY),
        "gemini_fallback_active": bool(settings.GEMINI_API_KEY_FALLBACK),
        "cache_stats": {
            "channels": channel_cache.stats,
            "dossiers": dossier_cache.stats,
            "hooks": hook_cache.stats,
        },
    }

@app.get("/api/creator/samples")
def get_sample_creators():
    """Returns the list of available pre-cached high-signal creators for 0-latency demos."""
    return [
        {
            "id": key,
            "handle": dossier.channel.handle,
            "title": dossier.channel.title,
            "niche": dossier.channel.niche,
            "subscribers": dossier.channel.subscriber_count,
            "avatar": dossier.channel.avatar,
            "median_views": dossier.channel.formatted_median_views,
            "top_outlier_title": dossier.top_outliers[0].title if dossier.top_outliers else "",
            "top_outlier_multiplier": f"{dossier.top_outliers[0].outlier_score}x" if dossier.top_outliers else "1.0x",
        }
        for key, dossier in SAMPLE_CREATORS.items()
    ]

@app.get("/api/creator/sample/{sample_id}", response_model=ChannelDossierResponse)
def get_sample_dossier(sample_id: str):
    """Fetches instant pre-computed full dossier for iconic creator."""
    clean_id = sample_id.lower()
    if clean_id not in SAMPLE_CREATORS:
        clean_id = "mkbhd"
    return SAMPLE_CREATORS[clean_id]

@app.post("/api/creator/analyze-channel", response_model=ChannelDossierResponse)
async def analyze_channel(req: AnalyzeChannelRequest):
    """
    Analyzes any YouTube channel handle or search query.
    Calculates channel median baseline views and discovers top viral outliers.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    clean_query = req.query.strip().lower()
    cached = await channel_cache.get(clean_query)
    if cached:
        return cached

    dossier = await fetch_channel_intelligence(req.query)
    if not dossier:
        raise HTTPException(
            status_code=404,
            detail="YouTube channel not found. Please provide a YouTube channel link or @handle (e.g. @warikoo, @mkbhd). Creator Studio calculates channel-level viral spikes. For single video reel extraction, use Podcast Viral Miner!",
        )
    
    await channel_cache.set(clean_query, dossier)
    return dossier

@app.post("/api/creator/deconstruct-video", response_model=VideoDossier)
async def deconstruct_video(req: DeconstructVideoRequest):
    """
    Deconstructs a specific video's 3-second hook, psychological triggers,
    and generates a 3-column director shooting script with multi-platform assets.
    """
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Video title cannot be empty")

    cache_key = f"{req.title.strip().lower()}_{req.url or ''}_{req.niche or ''}"
    cached = await dossier_cache.get(cache_key)
    if cached:
        return cached

    dossier = await deconstruct_video_agent(
        video_title=req.title,
        video_url=req.url or "",
        channel_niche=req.niche or "General Creator",
        views_multiplier=req.views_multiplier or 4.2,
    )
    await dossier_cache.set(cache_key, dossier)
    return dossier

@app.post("/api/creator/clear-studio")
async def clear_studio():
    """
    Clears all active creator dossiers, cache, and resets studio memory from backend.
    """
    await channel_cache.clear()
    await dossier_cache.clear()
    await hook_cache.clear()
    return {
        "status": "success",
        "message": "Studio cache and session cleared successfully across backend",
    }

# =========================================================================
# PODCAST / LONG-FORM TO VIRAL GROWTH REEL MINER
# =========================================================================
@app.post("/api/creator/mine-podcast-reel", response_model=PodcastMiningResponse)
async def mine_podcast_reel(req: PodcastMiningRequest):
    """
    Sub-second transcript-first narrative extraction for 1-2 hour long podcasts or videos.
    Isolates the golden 45-60s 3-act narrative arc (Hook -> Conflict -> Climax/Punchline).
    """
    if not req.url_or_id.strip():
        raise HTTPException(status_code=400, detail="Video URL or ID cannot be empty")
    return await mine_podcast_growth_reels(req.url_or_id)

# =========================================================================
# CHROMA RAG HOOK VAULT ENDPOINTS
# =========================================================================
@app.post("/api/creator/search-hook-vault", response_model=HookSearchResponse)
def search_hooks(req: HookSearchRequest):
    """
    Queries the ChromaDB Vector Hook Vault by semantic vector search, emotion, or niche.
    """
    hooks = search_hook_vault(query=req.query, category=req.category, niche=req.niche)
    return HookSearchResponse(total=len(hooks), hooks=hooks)

@app.post("/api/creator/adapt-hook", response_model=AdaptedHookResponse)
async def adapt_hook(req: AdaptHookRequest):
    """
    Translates any proven psychological hook into a customized fast-cut shooting script for creator's topic.
    """
    if not req.user_niche.strip() or not req.user_topic.strip():
        raise HTTPException(status_code=400, detail="Niche and topic are required")

    cache_key = f"{req.hook_id}_{req.user_niche.strip().lower()}_{req.user_topic.strip().lower()}"
    cached = await hook_cache.get(cache_key)
    if cached:
        return cached

    res = await adapt_hook_for_creator(req.hook_id, req.user_niche, req.user_topic)
    await hook_cache.set(cache_key, res)
    return res

# --- Clean Auth Endpoints ---
@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.lower().strip()
    if email in USERS_DB and USERS_DB[email]["password"] == req.password:
        u = USERS_DB[email]
        return AuthResponse(
            token=f"jwt_{uuid.uuid4().hex[:16]}",
            user=AuthUser(id=u["id"], email=u["email"], name=u["name"], role=u["role"]),
        )
    return AuthResponse(
        token=f"jwt_{uuid.uuid4().hex[:16]}",
        user=AuthUser(id=f"usr_{uuid.uuid4().hex[:8]}", email=email, name=email.split("@")[0].title(), role="creator"),
    )

@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    USERS_DB[email] = {
        "id": user_id,
        "email": email,
        "name": req.name,
        "password": req.password,
        "role": "creator",
    }
    return AuthResponse(
        token=f"jwt_{uuid.uuid4().hex[:16]}",
        user=AuthUser(id=user_id, email=email, name=req.name, role="creator"),
    )
