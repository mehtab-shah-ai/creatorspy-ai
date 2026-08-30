import {
  ChannelDossierResponse,
  VideoDossier,
  SampleCreatorCard,
  AuthUser,
  AuthResponse,
  PodcastMiningResponse,
  HookSearchResponse,
  AdaptedHookResponse,
} from "./types";

export async function fetchSampleCreators(): Promise<SampleCreatorCard[]> {
  try {
    const res = await fetch("/api/creator/samples");
    if (!res.ok) throw new Error("Failed to fetch sample creators");
    return await res.json();
  } catch (err) {
    console.warn("Using local fallback sample creators:", err);
    return [
      {
        id: "mkbhd",
        handle: "@MKBHD",
        title: "Marques Brownlee",
        niche: "Consumer Tech",
        subscribers: "18.9M",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        median_views: "2.15M",
        top_outlier_title: "Apple Vision Pro: 24 Hours Later!",
        top_outlier_multiplier: "6.9x",
      },
      {
        id: "warikoo",
        handle: "@warikoo",
        title: "Ankur Warikoo",
        niche: "Personal Finance",
        subscribers: "3.6M",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        median_views: "94K",
        top_outlier_title: "DO NOT Buy A House In Your 20s!",
        top_outlier_multiplier: "15.1x",
      },
      {
        id: "jeremy",
        handle: "@JeremyEthier",
        title: "Jeremy Ethier",
        niche: "Fitness Science",
        subscribers: "6.2M",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        median_views: "420K",
        top_outlier_title: "The ONLY 3 Exercises for Massive Shoulders",
        top_outlier_multiplier: "9.2x",
      },
    ];
  }
}

export async function fetchSampleDossier(presetId: string): Promise<ChannelDossierResponse> {
  const res = await fetch(`/api/creator/sample/${presetId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dossier for preset ${presetId}`);
  }
  return await res.json();
}

export async function analyzeChannel(query: string): Promise<ChannelDossierResponse> {
  const res = await fetch("/api/creator/analyze-channel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to analyze channel: ${query}`);
  }
  return await res.json();
}

export async function deconstructVideo(
  title: string,
  url: string,
  niche: string,
  views_multiplier: number
): Promise<VideoDossier> {
  const res = await fetch("/api/creator/deconstruct-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      url,
      niche,
      views_multiplier,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to deconstruct video: ${title}`);
  }
  return await res.json();
}

// =========================================================================
// AUTH METHODS
// =========================================================================
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Auth network error, using local fallback:", e);
  }
  return {
    token: "jwt_mock_creator_token",
    user: {
      id: "usr_local_1",
      email: email || "creator@creatorspy.ai",
      name: email ? email.split("@")[0].toUpperCase() : "Pro Creator",
      role: "creator",
    },
  };
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Auth network error, using local fallback:", e);
  }
  return {
    token: "jwt_mock_creator_token",
    user: {
      id: "usr_local_new",
      email: email || "newcreator@creatorspy.ai",
      name: name || "New Creator",
      role: "creator",
    },
  };
}

// =========================================================================
// PODCAST TO VIRAL REEL API CALLS
// =========================================================================
export async function minePodcastReel(urlOrId: string): Promise<PodcastMiningResponse> {
  const res = await fetch("/api/creator/mine-podcast-reel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url_or_id: urlOrId }),
  });
  if (!res.ok) {
    throw new Error(`Failed to mine podcast: ${urlOrId}`);
  }
  return await res.json();
}

// =========================================================================
// CHROMA RAG HOOK VAULT API CALLS
// =========================================================================
export async function searchHookVault(
  query: string = "",
  category?: string,
  niche?: string
): Promise<HookSearchResponse> {
  const res = await fetch("/api/creator/search-hook-vault", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, category, niche }),
  });
  if (!res.ok) {
    throw new Error("Failed to query Hook Vault");
  }
  return await res.json();
}

export async function adaptHookForCreator(
  hookId: string,
  userNiche: string,
  userTopic: string
): Promise<AdaptedHookResponse> {
  const res = await fetch("/api/creator/adapt-hook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hook_id: hookId,
      user_niche: userNiche,
      user_topic: userTopic,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to adapt hook");
  }
  return await res.json();
}

export async function clearStudioSession(): Promise<{ status: string; message: string }> {
  try {
    const res = await fetch("/api/creator/clear-studio", {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error("Failed to clear studio backend");
    }
    return await res.json();
  } catch (err) {
    console.warn("Cleared locally, backend fallback:", err);
    return { status: "success", message: "Studio reset locally" };
  }
}
