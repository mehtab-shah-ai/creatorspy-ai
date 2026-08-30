import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv("d:/Mehtab/ClarifyAI/.env")

async def test_llms():
    groq_primary = os.getenv("GROQ_API_KEY", "")
    gemini_primary = os.getenv("GEMINI_API_KEY", "")

    print("=== TESTING GROQ MODELS ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        for m in ["openai/gpt-oss-20b", "qwen/qwen3.6-27b", "groq/compound-mini"]:
            try:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_primary}", "Content-Type": "application/json"},
                    json={
                        "model": m,
                        "messages": [{"role": "user", "content": "respond in JSON with key status and value ok"}],
                        "response_format": {"type": "json_object"}
                    }
                )
                print(f"Groq {m} -> Status: {r.status_code}, Output: {r.text[:120]}")
            except Exception as e:
                print(f"Groq {m} Exception: {e}")

    print("\n=== TESTING GEMINI MODELS ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        for gm in ["gemini-2.5-flash", "gemini-flash-latest"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gm}:generateContent?key={gemini_primary}"
                r = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": "respond in JSON with key status and value ok"}]}],
                        "generationConfig": {"response_mime_type": "application/json"}
                    }
                )
                print(f"Gemini {gm} -> Status: {r.status_code}, Output: {r.text[:120]}")
            except Exception as e:
                print(f"Gemini {gm} Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_llms())
