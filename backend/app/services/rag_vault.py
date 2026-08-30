import os
import chromadb
from pathlib import Path
from typing import List, Optional, Dict, Any
from ..models import HookVaultItem
from .llm_engine import generate_structured_intelligence

# Initialize ChromaDB vector collection
CHROMA_DIR = Path(__file__).parent.parent.parent / "chroma_viral_db"
client = chromadb.PersistentClient(path=str(CHROMA_DIR))

try:
    collection = client.get_or_create_collection(
        name="viral_hooks",
        metadata={"description": "High-retention viral opening hook frameworks for creators"}
    )
except Exception:
    collection = client.get_or_create_collection(name="viral_hooks")

# Curated Goldmine of 18 Top-Tier Proven Viral Hook Frameworks (Indian & Global Icons)
CURATED_HOOKS = [
    {
        "id": "hook_1",
        "hook_text": "If you are between 22 and 30, this one single mistake will keep you poor for 20 years.",
        "emotion_category": "Effort Invalidation",
        "niche": "Finance",
        "creator_attribution": "Ankur Warikoo / Ali Abdaal",
        "retention_rate": "96%",
        "psychology_breakdown": "Age-targeted loss aversion + extreme time horizon creates an urgent cognitive itch.",
        "example_script_preview": "[0:00 - 0:03] Ripping paper into pieces. 'Aapke parents bolenge EMI bharo, par math kuch aur bolti hai.'",
    },
    {
        "id": "hook_2",
        "hook_text": "Apple did NOT want anyone to find out about this hidden setting... but I found it.",
        "emotion_category": "Curiosity Gap",
        "niche": "Tech",
        "creator_attribution": "Marques Brownlee (MKBHD)",
        "retention_rate": "95%",
        "psychology_breakdown": "Villainizing a trillion-dollar company + forbidden secret trigger stops user scrolling.",
        "example_script_preview": "[0:00 - 0:03] Phone screen directly against camera lens. 'Go to Settings -> Privacy right now.'",
    },
    {
        "id": "hook_3",
        "hook_text": "Stop doing bench press if your chest still looks flat. You are destroying your rotator cuffs.",
        "emotion_category": "Contrarian",
        "niche": "Fitness",
        "creator_attribution": "Jeremy Ethier / Jeff Nippard",
        "retention_rate": "94%",
        "psychology_breakdown": "Invalidating the viewer's existing gym effort makes them need to know what they did wrong.",
        "example_script_preview": "[0:00 - 0:03] 3D skeletal muscle tear simulation. 'Here are the only 2 exercises that build upper chest.'",
    },
    {
        "id": "hook_4",
        "hook_text": "I gave 1,000 strangers $10,000, but only if they survived 24 hours inside this abandoned island.",
        "emotion_category": "Shock",
        "niche": "Entertainment",
        "creator_attribution": "MrBeast",
        "retention_rate": "99%",
        "psychology_breakdown": "Extreme stakes + immediate visual spectacle. Zero intro, straight into high drama.",
        "example_script_preview": "[0:00 - 0:03] Drone dive into island. 'The rules are simple: touch the water, you are disqualified.'",
    },
    {
        "id": "hook_5",
        "hook_text": "Junior developers spend 6 months learning React. Senior developers use this 1 AI prompt instead.",
        "emotion_category": "Effort Invalidation",
        "niche": "AI & Coding",
        "creator_attribution": "Fireship",
        "retention_rate": "97%",
        "psychology_breakdown": "Status difference (Junior vs Senior) + unfair shortcut curiosity gap.",
        "example_script_preview": "[0:00 - 0:03] High-speed terminal fast cut. 'Here is how to scaffold a production SaaS in 60 seconds.'",
    },
    {
        "id": "hook_6",
        "hook_text": "Everyone tells you to wake up at 5 AM. Here is why doing that is ruining your cognitive health.",
        "emotion_category": "Contrarian",
        "niche": "Productivity",
        "creator_attribution": "Andrew Huberman",
        "retention_rate": "93%",
        "psychology_breakdown": "Disproving popular advice gives viewers immediate relief and curiosity.",
        "example_script_preview": "[0:00 - 0:03] Looking seriously into lens. 'Your circadian chronotype cannot be hacked by an alarm.'",
    },
    {
        "id": "hook_7",
        "hook_text": "I spent $50,000 testing Facebook ads so you don't have to waste a single rupee.",
        "emotion_category": "FOMO",
        "niche": "Business",
        "creator_attribution": "Alex Hormozi",
        "retention_rate": "95%",
        "psychology_breakdown": "High financial sacrifice on behalf of the viewer. Unfair value exchange.",
        "example_script_preview": "[0:00 - 0:03] Slamming dashboard printouts on desk. 'Rule #1: Never target interests in 2026.'",
    },
    {
        "id": "hook_8",
        "hook_text": "99% of people are using ChatGPT completely wrong. This 3-word phrase 10x's your output quality.",
        "emotion_category": "Curiosity Gap",
        "niche": "AI & Coding",
        "creator_attribution": "Tech Guy / Growth Hacker",
        "retention_rate": "98%",
        "psychology_breakdown": "Universal self-doubt (Am I the 99%?) combined with a simple, actionable solution.",
        "example_script_preview": "[0:00 - 0:03] Typing on mechanical keyboard. 'Instead of asking for a summary, tell it this exact role.'",
    },
    {
        "id": "hook_9",
        "hook_text": "If you are grinding 500 LeetCode problems in 2026, you are preparing for jobs that no longer exist.",
        "emotion_category": "Contrarian",
        "niche": "AI & Coding",
        "creator_attribution": "Harkirat Singh",
        "retention_rate": "97%",
        "psychology_breakdown": "Challenges the sacred cow of software engineering prep, forcing every CS student to stop scrolling.",
        "example_script_preview": "[0:00 - 0:03] Closing laptop with a thud. 'Companies don't hire LeetCoders anymore, they hire Loop Engineers.'",
    },
    {
        "id": "hook_10",
        "hook_text": "Do NOT buy this phone before testing this one hidden camera setting in direct sunlight.",
        "emotion_category": "FOMO",
        "niche": "Tech",
        "creator_attribution": "Tech Burner",
        "retention_rate": "96%",
        "psychology_breakdown": "Direct warning + buyer protection instinct stops high-intent purchase scrollers immediately.",
        "example_script_preview": "[0:00 - 0:03] Phone camera lens zoomed right into camera. 'See this lens flare? It completely ruins nighttime video.'",
    },
    {
        "id": "hook_11",
        "hook_text": "The government has a legal tax exemption that saves salaried employees ₹1,50,000 every single year.",
        "emotion_category": "Curiosity Gap",
        "niche": "Finance",
        "creator_attribution": "Finance with Sharan",
        "retention_rate": "97%",
        "psychology_breakdown": "Free legal money from the government triggers instant high-value urgency for any taxpayer.",
        "example_script_preview": "[0:00 - 0:03] Holding a mock tax form with a red stamp. 'Section 80CCD is the one thing your HR never explains.'",
    },
    {
        "id": "hook_12",
        "hook_text": "The dark psychology trick that every social media app uses to steal 4 hours of your day.",
        "emotion_category": "Shock",
        "niche": "Tech",
        "creator_attribution": "Dhruv Rathee",
        "retention_rate": "95%",
        "psychology_breakdown": "Exposes invisible manipulation by big tech, creating anger and protective curiosity.",
        "example_script_preview": "[0:00 - 0:03] Phone screen displaying endless scroll animation. 'It is called intermittent variable reward.'",
    },
    {
        "id": "hook_13",
        "hook_text": "I asked 100 self-made Indian millionaires the #1 skill they look for. Not a single one said college degree.",
        "emotion_category": "Effort Invalidation",
        "niche": "Business",
        "creator_attribution": "Raj Shamani",
        "retention_rate": "96%",
        "psychology_breakdown": "Disproves formal education myth with overwhelming survey authority from actual rich people.",
        "example_script_preview": "[0:00 - 0:03] Split-screen with podcast microphone. 'The only skill that actually creates wealth is distribution.'",
    },
    {
        "id": "hook_14",
        "hook_text": "If you invest ₹10,000 every month in a fixed deposit, inflation is silently robbing half your wealth.",
        "emotion_category": "Shock",
        "niche": "Finance",
        "creator_attribution": "Tanmay Bhat",
        "retention_rate": "94%",
        "psychology_breakdown": "Attacks the safest traditional investment (FD) with harsh mathematical reality.",
        "example_script_preview": "[0:00 - 0:03] Bank passbook burning animation. '7% return minus 6% inflation minus 30% tax equals negative wealth.'",
    },
    {
        "id": "hook_15",
        "hook_text": "Why working 14 hours a day is keeping you trapped in the rat race while other 22-year-olds make 10x more.",
        "emotion_category": "Effort Invalidation",
        "niche": "Business",
        "creator_attribution": "Iman Gadzhi",
        "retention_rate": "95%",
        "psychology_breakdown": "High-effort low-reward frustration trigger. Viewers want the unfair leverage secret.",
        "example_script_preview": "[0:00 - 0:03] Walking towards camera in luxury apartment. 'Labor doesn't scale. Code, media, and capital scale.'",
    },
    {
        "id": "hook_16",
        "hook_text": "The 2-hour daily deep work protocol that replaces an entire 8-hour corporate work day.",
        "emotion_category": "Contrarian",
        "niche": "Productivity",
        "creator_attribution": "Dan Koe",
        "retention_rate": "93%",
        "psychology_breakdown": "Extreme time compression promise appeals to burned-out desk workers seeking freedom.",
        "example_script_preview": "[0:00 - 0:03] Timer ticking from 02:00:00 to 00:00:00. 'Protect the first 120 minutes of your morning with your life.'",
    },
    {
        "id": "hook_17",
        "hook_text": "Drinking coffee in your first 90 minutes of waking up is causing your 3 PM energy crash.",
        "emotion_category": "Contrarian",
        "niche": "Fitness",
        "creator_attribution": "BeerBiceps / Huberman",
        "retention_rate": "95%",
        "psychology_breakdown": "Targets a universal habit that 80% of viewers do daily, creating instant realization.",
        "example_script_preview": "[0:00 - 0:03] Pushing coffee mug away on table. 'Adenosine receptors need 90 minutes to clear naturally.'",
    },
    {
        "id": "hook_18",
        "hook_text": "This mathematical riddle seems totally impossible until you look at the problem backwards.",
        "emotion_category": "Curiosity Gap",
        "niche": "Tech",
        "creator_attribution": "Veritasium",
        "retention_rate": "98%",
        "psychology_breakdown": "Intellectual challenge where the viewer wants to test their brain against the riddle.",
        "example_script_preview": "[0:00 - 0:03] Whiteboard drawing with 100 numbered boxes. '99% of people fail this in the first 10 seconds.'",
    },
]

# Initialize dedicated Viral Mechanics Vector Collection
try:
    mechanics_collection = client.get_or_create_collection(
        name="viral_mechanics",
        metadata={"description": "Deep algorithmic virality and retention engineering rules"}
    )
except Exception:
    mechanics_collection = client.get_or_create_collection(name="viral_mechanics")

VIRAL_MECHANICS_KNOWLEDGE = [
    {
        "id": "mech_1",
        "title": "VVCR Threshold & The 3-Second Retention Cliff",
        "rule": "YouTube Shorts and Instagram Reels algorithm prioritize View vs Swipe-Away Ratio (VVCR). If over 75% of viewers swipe away before second 3, distribution dies instantly. Reaching >80% retention past second 3 signals the algorithm to push the video to 10x broader explore audiences.",
        "application": "Open with an aggressive sensory interrupt or bold visual prop within the first 1.5 seconds to anchor attention before the thumb can swipe."
    },
    {
        "id": "mech_2",
        "title": "The Zeigarnik Effect & Open Loops",
        "rule": "Human brains experience cognitive tension when presented with an incomplete story or contradiction. Videos that open with an unresolved puzzle and delay the answer until the final 15% of runtime maintain high average view duration (AVD).",
        "application": "Never reveal the solution in Scene 1. Establish the paradox at 0:00, escalate the stakes at 0:15, and deliver the golden insight at the climax."
    },
    {
        "id": "mech_3",
        "title": "Effort Invalidation & The Unfair Shortcut",
        "rule": "Viewers are conditioned to seek high leverage. Telling an audience that their traditional hard work (e.g. 6 months learning X, grinding 500 problems, saving in FD) is flawed forces them to stop and re-evaluate their identity.",
        "application": "Structure the hook as: [Sacred traditional method] is keeping you [undesirable state]. Use this [counter-intuitive lever] instead."
    },
    {
        "id": "mech_4",
        "title": "Pacing Velocity & 2.2-Second Stimulus Reset",
        "rule": "Modern viewer attention experiences micro-fatigue every 2.5 to 3 seconds. Retention charts drop monotonically unless there is an optical or acoustic reset.",
        "application": "Alternate camera angles, insert kinetic keyword text, or trigger a whoosh/riser sound effect every 2.0 to 2.5 seconds."
    },
    {
        "id": "mech_5",
        "title": "Seamless Loop Audio Trick (APV > 100%)",
        "rule": "When a short-form video achieves an Average Percentage Viewed (APV) exceeding 100%, YouTube's recommendation neural network classifies it as an ultra-high engagement asset and scales it virally.",
        "application": "End the video mid-sentence or with a phrase that connects grammatically into the very first word spoken in the opening scene."
    },
    {
        "id": "mech_6",
        "title": "Contrarian Polarization & Comment Section Warfare",
        "rule": "Algorithms treat comment velocity in the first 60 minutes as a core virality signal. Challenging widely accepted beliefs triggers strong emotional defense reactions in the comments.",
        "application": "Take an unapologetic stance against popular industry dogma. People who agree will share; people who disagree will debate in comments."
    },
    {
        "id": "mech_7",
        "title": "Click-to-Play Visual Continuity (Zero Bait)",
        "rule": "If the visual imagery promised in the thumbnail is absent in the first 2 seconds of playback, bounce rate surges to over 60%. Continuity between thumbnail and scene 1 anchors trust.",
        "application": "Show the exact object, outfit, or expression featured in the thumbnail right on screen at second 0:00."
    },
    {
        "id": "mech_8",
        "title": "Personal Sacrifice & High-Stakes Empathy",
        "rule": "When a creator absorbs financial, temporal, or physical pain on behalf of the viewer, the viewer perceives the advice as extraordinarily high value and unbiased.",
        "application": "'I tested 100 items / spent ₹50,000 / wasted 2 years so you can get the result in 60 seconds.'"
    }
]

# Populate ChromaDB with all curated hooks & viral mechanics using upsert
try:
    for h in CURATED_HOOKS:
        collection.upsert(
            ids=[h["id"]],
            documents=[f"{h['hook_text']} Category: {h['emotion_category']} Niche: {h['niche']} Psychology: {h['psychology_breakdown']}"],
            metadatas=[{
                "emotion_category": h["emotion_category"],
                "niche": h["niche"],
                "creator": h["creator_attribution"],
                "retention": h["retention_rate"],
            }]
        )
    for m in VIRAL_MECHANICS_KNOWLEDGE:
        mechanics_collection.upsert(
            ids=[m["id"]],
            documents=[f"{m['title']}: {m['rule']} Application: {m['application']}"],
            metadatas=[{"title": m["title"]}]
        )
except Exception as e:
    print(f"[ChromaDB Upsert Warning]: {e}")

def query_viral_mechanics(query: str, n_results: int = 2) -> str:
    try:
        res = mechanics_collection.query(query_texts=[query], n_results=n_results)
        docs = res.get("documents", [[]])[0]
        if docs:
            return "\n".join([f"- {d}" for d in docs])
    except Exception:
        pass
    return "- Pacing velocity: Visual stimulus switch every 2.2 seconds. Open loop: Pose the riddle in scene 1 and delay payoff to scene 3."

def search_hook_vault(query: str = "", category: Optional[str] = None, niche: Optional[str] = None) -> List[HookVaultItem]:
    filtered = CURATED_HOOKS

    if category and category.lower() != "all":
        filtered = [h for h in filtered if h["emotion_category"].lower() == category.lower()]

    if niche and niche.lower() != "all":
        filtered = [h for h in filtered if h["niche"].lower() == niche.lower()]

    if query.strip():
        q_lower = query.lower()
        # Semantic search using ChromaDB
        try:
            results = collection.query(query_texts=[query], n_results=min(len(CURATED_HOOKS), 8))
            matched_ids = results.get("ids", [[]])[0]
            if matched_ids:
                return [HookVaultItem(**h) for h in CURATED_HOOKS if h["id"] in matched_ids]
        except Exception:
            pass

        # Text search fallback
        filtered = [h for h in filtered if q_lower in h["hook_text"].lower() or q_lower in h["psychology_breakdown"].lower()]

    return [HookVaultItem(**h) for h in filtered]

async def adapt_hook_for_creator(hook_id: str, user_niche: str, user_topic: str) -> Dict[str, Any]:
    target_hook = next((h for h in CURATED_HOOKS if h["id"] == hook_id), CURATED_HOOKS[0])

    system_prompt = "You are an elite YouTube and TikTok viral script director with 100M+ views per video."
    prompt = f"""
    The creator wants to adapt this viral psychological framework:
    ORIGINAL HOOK: "{target_hook['hook_text']}"
    PSYCHOLOGICAL TRIGGER: "{target_hook['psychology_breakdown']}"
    
    FOR THEIR CHANNEL:
    CREATOR NICHE: "{user_niche}"
    CREATOR VIDEO TOPIC: "{user_topic}"
    
    Generate an adapted high-retention shooting package in JSON matching this exact structure:
    {{
      "adapted_hook_line": "The exact first spoken sentence for seconds 0-3 tailored to '{user_topic}'",
      "visual_pattern_interrupt": "Physical camera action to perform in seconds 0-3",
      "thumbnail_3_word_text": "3 bold high-impact words for thumbnail",
      "predicted_retention_score": 93,
      "why_this_will_blow_up": "Why this adapted hook will stop the viewer in {user_niche}",
      "fast_cut_script": [
        {{"timestamp": "0:00 - 0:03", "camera": "Macro close-up with dramatic eye-level lighting", "dialogue": "Spoken hook sentence", "sound_fx": "[Deep bass drop]"}},
        {{"timestamp": "0:04 - 0:15", "camera": "Hard cut to wide angle desk setup, revealing data", "dialogue": "The high-stakes conflict", "sound_fx": "[Quick whoosh]"}},
        {{"timestamp": "0:16 - 0:35", "camera": "POV screen demonstration showing real framework", "dialogue": "The golden insight reveal", "sound_fx": "[Success chime]"}}
      ]
    }}
    Respond strictly in JSON format. No markdown ticks, no preamble.
    """

    fallback = {
        "adapted_hook_line": f"If you are trying to succeed in {user_niche}, this one mistake with {user_topic} is wasting months of your life.",
        "visual_pattern_interrupt": f"Snap zoom directly on camera lens while holding a physical notepad showing a shocking stat about {user_topic}.",
        "thumbnail_3_word_text": "STOP DOING THIS",
        "predicted_retention_score": 94,
        "why_this_will_blow_up": f"Leverages the proven '{target_hook.get('emotion_category', 'Curiosity Gap')}' psychological trigger to invalidate common assumptions in {user_niche}.",
        "fast_cut_script": [
            {
                "timestamp": "0:00 - 0:03",
                "camera": "Macro close-up with dramatic eye-level lighting",
                "dialogue": f"If you are trying to succeed in {user_niche}, stop doing {user_topic} like everyone else.",
                "sound_fx": "[Sub-bass impact]",
            },
            {
                "timestamp": "0:04 - 0:15",
                "camera": "Hard cut to wide angle desk setup, revealing data or notes",
                "dialogue": "Look at what 90% of creators do versus what actually generates results.",
                "sound_fx": "[Paper rustle + quick whoosh]",
            },
            {
                "timestamp": "0:16 - 0:35",
                "camera": "POV screen demonstration showing the real framework",
                "dialogue": "Here is the exact step-by-step protocol you can implement today to 10x your output.",
                "sound_fx": "[Success chime]",
            },
        ],
    }

    try:
        res = await generate_structured_intelligence(prompt, system_prompt)
        if res and "adapted_hook_line" in res:
            # Handle potential LLM key mismatch
            if "fast_cut_script" not in res and "three_scene_shooting_plan" in res:
                res["fast_cut_script"] = [
                    {
                        "timestamp": r.get("timing", r.get("timestamp", "0:00 - 0:10")),
                        "camera": r.get("direction", r.get("camera", "Close-up")),
                        "dialogue": r.get("dialogue", ""),
                        "sound_fx": r.get("sound_fx", "[Upbeat sound]"),
                    }
                    for r in res["three_scene_shooting_plan"]
                ]
            if "fast_cut_script" not in res or not isinstance(res.get("fast_cut_script"), list):
                res["fast_cut_script"] = fallback["fast_cut_script"]
            if "thumbnail_3_word_text" not in res:
                res["thumbnail_3_word_text"] = fallback["thumbnail_3_word_text"]
            if "predicted_retention_score" not in res:
                res["predicted_retention_score"] = fallback["predicted_retention_score"]
            if "why_this_will_blow_up" not in res:
                res["why_this_will_blow_up"] = fallback["why_this_will_blow_up"]
            return res
    except Exception as e:
        print(f"[RAG Vault Adapt Warning]: {e}")

    return fallback
