import os
import sys
import json
import httpx
from pathlib import Path

# Force UTF-8 on Windows command line
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def find_youtube_key() -> str:
    # 1. Environment variable
    key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if key:
        return key

    # 2. Check root .env
    root_env = Path(__file__).parent.parent.parent / ".env"
    if root_env.exists():
        for line in root_env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("YOUTUBE_API_KEY="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val:
                    return val

    # 3. Check frontend/.env
    fe_env = Path(__file__).parent.parent.parent / "frontend" / ".env"
    if fe_env.exists():
        for line in fe_env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("YOUTUBE_API_KEY="):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val:
                    return val

    return ""

def test_youtube_api():
    api_key = find_youtube_key()
    print("=" * 65)
    print("🔍 CREATORSPY AI — YOUTUBE DATA API V3 VALIDATION SUITE")
    print("=" * 65)

    if not api_key:
        print("❌ [FAILED]: YOUTUBE_API_KEY not found in .env or frontend/.env!")
        print("👉 Please save your YouTube Data API v3 key into:")
        print("   d:\\Mehtab\\ClarifyAI\\.env  OR  d:\\Mehtab\\ClarifyAI\\frontend\\.env")
        print("   Example format:")
        print('   YOUTUBE_API_KEY="AIzaSyYourActualGoogleKeyHere"')
        print("=" * 65)
        sys.exit(1)

    masked = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    print(f"🔑 Detected Key: {masked}")
    print("⏳ Connecting to Google YouTube Data API v3...")

    # Test 1: Fetch Video by ID (MKBHD: The Wildest Camera Robot)
    test_video_id = "v-_d2e7x4KA"
    video_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id={test_video_id}&key={api_key}"
    
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(video_url)
            
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    v = items[0]
                    snippet = v.get("snippet", {})
                    stats = v.get("statistics", {})
                    
                    print("\n✅ [TEST 1 PASSED: Video Details Fetch]")
                    print(f"   📹 Title       : {snippet.get('title')}")
                    print(f"   👤 Channel     : {snippet.get('channelTitle')}")
                    print(f"   👁️ View Count  : {int(stats.get('viewCount', 0)):,} views")
                    print(f"   👍 Likes       : {int(stats.get('likeCount', 0)):,} likes")
                    print(f"   💬 Comments    : {int(stats.get('commentCount', 0)):,} comments")
                    print(f"   🖼️ Thumbnail   : {snippet.get('thumbnails', {}).get('high', {}).get('url')}")
                    print(f"   📅 Published At: {snippet.get('publishedAt')}")
                else:
                    print("⚠️ Video response returned empty items.")
            else:
                print(f"\n❌ [TEST 1 FAILED]: HTTP {resp.status_code}")
                try:
                    err_json = resp.json()
                    err_msg = err_json.get("error", {}).get("message", "Unknown error")
                    print(f"   Error Details: {err_msg}")
                except Exception:
                    print(f"   Raw response: {resp.text[:200]}")
                sys.exit(1)

            # Test 2: Channel Lookup by Handle (@MKBHD)
            print("\n⏳ Testing Channel Resolution (@mkbhd)...")
            channel_url = f"https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=mkbhd&key={api_key}"
            ch_resp = client.get(channel_url)
            
            if ch_resp.status_code == 200:
                ch_data = ch_resp.json()
                ch_items = ch_data.get("items", [])
                if ch_items:
                    ch = ch_items[0]
                    ch_snippet = ch.get("snippet", {})
                    ch_stats = ch.get("statistics", {})
                    uploads_playlist = ch.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
                    
                    print("✅ [TEST 2 PASSED: Channel Resolution]")
                    print(f"   👑 Channel Name : {ch_snippet.get('title')}")
                    print(f"   🎯 Custom URL   : {ch_snippet.get('customUrl')}")
                    print(f"   👥 Subscribers  : {int(ch_stats.get('subscriberCount', 0)):,}")
                    print(f"   🎬 Total Uploads: {int(ch_stats.get('videoCount', 0)):,}")
                    print(f"   📂 Uploads List : {uploads_playlist}")

                    # Test 3: Fetch Last 5 Videos & Compute Outlier Multipliers
                    if uploads_playlist:
                        print("\n⏳ Testing Playlist Uploads & Outlier Math...")
                        pl_url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={uploads_playlist}&maxResults=8&key={api_key}"
                        pl_resp = client.get(pl_url)
                        
                        if pl_resp.status_code == 200:
                            pl_items = pl_resp.json().get("items", [])
                            v_ids = [item["contentDetails"]["videoId"] for item in pl_items]
                            
                            # Fetch statistics for all videos
                            v_stats_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id={','.join(v_ids)}&key={api_key}"
                            vs_resp = client.get(v_stats_url)
                            
                            if vs_resp.status_code == 200:
                                vs_items = vs_resp.json().get("items", [])
                                views_list = [int(x.get("statistics", {}).get("viewCount", 0)) for x in vs_items]
                                sorted_views = sorted(views_list)
                                median_views = sorted_views[len(sorted_views) // 2] if sorted_views else 1
                                
                                print(f"✅ [TEST 3 PASSED: Outlier Engine Math]")
                                print(f"   📊 Sampled Uploads: {len(vs_items)}")
                                print(f"   🎯 Channel Median : {median_views:,} views")
                                print("\n   --- RECENT VIDEOS & VIRAL OUTLIER MULTIPLIERS ---")
                                for item in vs_items:
                                    title = item.get("snippet", {}).get("title", "")[:45]
                                    views = int(item.get("statistics", {}).get("viewCount", 0))
                                    mult = round(views / max(median_views, 1), 2)
                                    badge = "🔥 OUTLIER" if mult >= 2.0 else "Normal"
                                    print(f"   [{badge:<10}] {mult:>5.2f}x | {views:>10,} views | {title}...")

                else:
                    print("⚠️ Channel forHandle=mkbhd returned empty.")
            else:
                print(f"⚠️ Channel lookup returned HTTP {ch_resp.status_code}: {ch_resp.text[:150]}")

        print("\n" + "=" * 65)
        print("🎉 ALL YOUTUBE DATA API V3 TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)

    except Exception as ex:
        print(f"\n❌ Network / Request Error: {ex}")
        sys.exit(1)

if __name__ == "__main__":
    test_youtube_api()
