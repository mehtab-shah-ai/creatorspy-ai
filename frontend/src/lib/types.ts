export interface VideoItem {
  id: string;
  title: string;
  url: string;
  views: number;
  formatted_views: string;
  thumbnail: string;
  published_at?: string;
  is_short?: boolean;
  outlier_score: number;
  is_outlier: boolean;
  is_mega_viral?: boolean;
  outlier_badge: string;
}

export interface ChannelProfile {
  handle: string;
  title: string;
  description: string;
  avatar: string;
  subscriber_count: string;
  total_videos_analyzed: number;
  median_views: number;
  formatted_median_views: string;
  viral_breakout_rate: string;
  niche: string;
}

export interface HookForensics {
  first_3_seconds_visual: string;
  first_3_seconds_audio: string;
  primary_psychological_trigger: string;
  trigger_explanation: string;
  hook_strength_score: number;
}

export interface RetentionPacing {
  estimated_hook_retention_pct: number;
  dropoff_risk_timestamp: string;
  pacing_rhythm: string;
  b_roll_frequency: string;
  why_viewers_stay: string;
}

export interface DirectorScriptRow {
  timestamp: string;
  camera_direction: string;
  dialogue: string;
  on_screen_text: string;
  sound_fx: string;
}

export interface ThumbnailStrategy {
  recommended_text_overlay: string;
  facial_expression_guide: string;
  color_contrast_palette: string;
  high_ctr_logic: string;
}

export interface LinkedInSlide {
  slide: number;
  title: string;
  body: string;
}

export interface MultiPlatformAssets {
  reel_caption: string;
  hashtags: string[];
  twitter_thread: string[];
  linkedin_carousel_slides: LinkedInSlide[];
}

export interface ViralityBreakdown {
  why_it_blew_up: string;
  algorithmic_trigger: string;
  psychological_hook: string;
  retention_mechanic: string;
}

export interface NextViralPlaybook {
  recommended_topic: string;
  exact_opening_line: string;
  visual_pattern_interrupt: string;
  retention_rule_to_apply: string;
}

export interface VideoDossier {
  video: VideoItem;
  hook_forensics: HookForensics;
  retention_pacing: RetentionPacing;
  director_script: DirectorScriptRow[];
  thumbnail_strategy: ThumbnailStrategy;
  multi_platform: MultiPlatformAssets;
  replication_concepts: string[];
  virality_breakdown?: ViralityBreakdown;
  next_viral_playbook?: NextViralPlaybook;
}

export interface ChannelDossierResponse {
  channel: ChannelProfile;
  videos: VideoItem[];
  top_outliers: VideoItem[];
  active_dossier: VideoDossier;
}

export interface SampleCreatorCard {
  id: string;
  handle: string;
  title: string;
  niche: string;
  subscribers: string;
  avatar: string;
  median_views: string;
  top_outlier_title: string;
  top_outlier_multiplier: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// =========================================================================
// PODCAST TO VIRAL REEL MINER TYPES
// =========================================================================
export interface PodcastDirectorCue {
  timestamp: string;
  camera: string;
  sound_fx: string;
  on_screen_text: string;
}

export interface PodcastClipCandidate {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  start_seconds: number;
  virality_score: number;
  psychological_hook_type: string;
  hook_line: string;
  full_transcript_segment: string;
  reel_title: string;
  reel_caption: string;
  hashtags: string[];
  director_cues: PodcastDirectorCue[];
}

export interface PodcastMiningResponse {
  source_video_title: string;
  source_video_id: string;
  source_channel: string;
  total_podcast_duration: string;
  extracted_clips: PodcastClipCandidate[];
}

// =========================================================================
// CHROMA RAG HOOK VAULT TYPES
// =========================================================================
export interface HookVaultItem {
  id: string;
  hook_text: string;
  emotion_category: string;
  niche: string;
  creator_attribution: string;
  retention_rate: string;
  psychology_breakdown: string;
  example_script_preview: string;
}

export interface HookSearchResponse {
  total: number;
  hooks: HookVaultItem[];
}

export interface AdaptedHookResponse {
  adapted_hook_line: string;
  visual_pattern_interrupt: string;
  thumbnail_3_word_text: string;
  fast_cut_script: {
    timestamp: string;
    camera: string;
    dialogue: string;
    sound_fx: string;
  }[];
  predicted_retention_score: number;
  why_this_will_blow_up: string;
}
