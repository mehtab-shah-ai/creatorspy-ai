from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VideoItem(BaseModel):
    id: str
    title: str
    url: str
    views: int
    formatted_views: str
    thumbnail: str
    published_at: str = ""
    is_short: bool = False
    outlier_score: float = 1.0  # (Views / Channel Median)
    is_outlier: bool = False     # >= 2.5x
    is_mega_viral: bool = False  # >= 5.0x
    outlier_badge: str = "Average" # "Normal", "Viral Breakout 🔥", "Mega Outlier 🚀"

class ChannelProfile(BaseModel):
    handle: str
    title: str
    description: str = ""
    avatar: str = ""
    subscriber_count: str = ""
    total_videos_analyzed: int = 0
    median_views: int = 0
    formatted_median_views: str = "0"
    viral_breakout_rate: str = "0%"
    niche: str = "General Creator"

class HookForensics(BaseModel):
    first_3_seconds_visual: str = Field(..., description="What happens visually in seconds 0-3")
    first_3_seconds_audio: str = Field(..., description="Exact spoken dialogue in seconds 0-3")
    primary_psychological_trigger: str = Field(..., description="Negative Bias, Curiosity Gap, Shocking Metric, etc.")
    trigger_explanation: str
    hook_strength_score: int = Field(default=92, ge=0, le=100)

class RetentionPacing(BaseModel):
    estimated_hook_retention_pct: int = Field(default=86, ge=0, le=100)
    dropoff_risk_timestamp: str = "0:14"
    pacing_rhythm: str = "Fast-cut (1.8s per visual switch)"
    b_roll_frequency: str = "Every 3-4 seconds"
    why_viewers_stay: str

class DirectorScriptRow(BaseModel):
    timestamp: str
    camera_direction: str
    dialogue: str
    on_screen_text: str
    sound_fx: str

class ThumbnailStrategy(BaseModel):
    recommended_text_overlay: str
    facial_expression_guide: str
    color_contrast_palette: str
    high_ctr_logic: str

class MultiPlatformAssets(BaseModel):
    reel_caption: str
    hashtags: List[str]
    twitter_thread: List[str]
    linkedin_carousel_slides: List[dict]  # {"slide": 1, "title": "", "body": ""}

class ViralityBreakdown(BaseModel):
    why_it_blew_up: str = Field(..., description="1-sentence plain-language summary of why the video exploded")
    algorithmic_trigger: str = Field(..., description="The exact algorithmic signal (e.g. 84% View vs Swipe ratio)")
    psychological_hook: str = Field(..., description="Cognitive trigger in the first 3 seconds that stopped scrolling")
    retention_mechanic: str = Field(..., description="Why viewers stayed until the end without dropping off")

class NextViralPlaybook(BaseModel):
    recommended_topic: str = Field(..., description="Next suggested high-potential topic based on this viral hit")
    exact_opening_line: str = Field(..., description="Word-for-word opening sentence to read on camera")
    visual_pattern_interrupt: str = Field(..., description="Physical prop or camera movement for seconds 0-3")
    retention_rule_to_apply: str = Field(..., description="Actionable editing / pacing rule to guarantee viral retention")

class VideoDossier(BaseModel):
    video: VideoItem
    hook_forensics: HookForensics
    retention_pacing: RetentionPacing
    director_script: List[DirectorScriptRow]
    thumbnail_strategy: ThumbnailStrategy
    multi_platform: MultiPlatformAssets
    replication_concepts: List[str]
    virality_breakdown: Optional[ViralityBreakdown] = None
    next_viral_playbook: Optional[NextViralPlaybook] = None

class ChannelDossierResponse(BaseModel):
    channel: ChannelProfile
    videos: List[VideoItem]
    top_outliers: List[VideoItem]
    active_dossier: VideoDossier

# =========================================================================
# PODCAST / LONG-FORM TO VIRAL GROWTH REEL SCHEMAS
# =========================================================================
class PodcastClipCandidate(BaseModel):
    id: str
    title: str
    start_time: str      # e.g. "0:42:15"
    end_time: str        # e.g. "0:43:08"
    duration_seconds: int
    start_seconds: int
    virality_score: int  # 0 to 100
    psychological_hook_type: str
    hook_line: str
    full_transcript_segment: str
    reel_title: str
    reel_caption: str
    hashtags: List[str]
    director_cues: List[Dict[str, str]] # timestamp, camera, sound_fx, on_screen_text

class PodcastMiningRequest(BaseModel):
    url_or_id: str
    target_platform: str = "Instagram Reel & YouTube Shorts"

class PodcastMiningResponse(BaseModel):
    source_video_title: str
    source_video_id: str
    source_channel: str
    total_podcast_duration: str
    extracted_clips: List[PodcastClipCandidate]

# =========================================================================
# CHROMA RAG HOOK VAULT SCHEMAS
# =========================================================================
class HookVaultItem(BaseModel):
    id: str
    hook_text: str
    emotion_category: str   # Curiosity Gap, Contrarian, Effort Invalidation, FOMO, Shock
    niche: str              # Tech, Finance, Fitness, AI & Coding, Business
    creator_attribution: str
    retention_rate: str     # e.g. "94%"
    psychology_breakdown: str
    example_script_preview: str

class HookSearchRequest(BaseModel):
    query: str = ""
    category: Optional[str] = None
    niche: Optional[str] = None

class HookSearchResponse(BaseModel):
    total: int
    hooks: List[HookVaultItem]

class AdaptHookRequest(BaseModel):
    hook_id: str
    user_niche: str
    user_topic: str

class FastCutScriptRow(BaseModel):
    timestamp: str
    camera: str
    dialogue: str
    sound_fx: str = "[Upbeat audio impact]"

class AdaptedHookResponse(BaseModel):
    adapted_hook_line: str
    visual_pattern_interrupt: str
    thumbnail_3_word_text: str
    fast_cut_script: List[FastCutScriptRow]
    predicted_retention_score: int = 92
    why_this_will_blow_up: str = ""

# =========================================================================
# AUTH SCHEMAS
# =========================================================================
class AuthUser(BaseModel):
    id: str
    email: str
    name: str
    role: str = "creator"

class AuthResponse(BaseModel):
    token: str
    user: AuthUser

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
