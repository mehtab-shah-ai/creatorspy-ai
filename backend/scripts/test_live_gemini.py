import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv("d:/Mehtab/ClarifyAI/.env")

async def test():
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    async with httpx.AsyncClient(timeout=8.0) as client:
        for gm in ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gm}:generateContent?key={gemini_key}"
            try:
                r = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": "respond in JSON with key test"}]}],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                )
                print(f"Gemini {gm} -> Status: {r.status_code}, Body: {r.text[:120]}")
            except Exception as e:
                print(f"Gemini {gm} Error: {e}")

asyncio.run(test())
