import json
import httpx
from typing import Optional, Dict, Any, List
from ..config import settings

async def call_groq(prompt: str, system_prompt: str, api_key: str, json_mode: bool = True) -> Optional[str]:
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            body = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
            }
            if json_mode:
                body["response_format"] = {"type": "json_object"}

            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[LLM Engine: Groq Warning]: {e}")
    return None

async def call_gemini(prompt: str, system_prompt: str, api_key: str) -> Optional[str]:
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            body = {
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "response_mime_type": "application/json"},
            }
            resp = await client.post(url, json=body)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"[LLM Engine: Gemini Warning]: {e}")
    return None

def _parse_json(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    clean = text.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    try:
        return json.loads(clean.strip())
    except Exception:
        return None

async def generate_structured_intelligence(prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    """
    Executes resilient cascading generation across 4 tiers of API keys:
    Tier 1: Groq Primary (Llama-3.3-70B, ~200ms)
    Tier 2: Groq Fallback
    Tier 3: Gemini Primary (Flash)
    Tier 4: Gemini Fallback
    """
    # Tier 1: Groq Primary
    out = await call_groq(prompt, system_prompt, settings.GROQ_API_KEY)
    res = _parse_json(out)
    if res:
        return res

    # Tier 2: Groq Fallback
    if settings.GROQ_API_KEY_FALLBACK:
        out = await call_groq(prompt, system_prompt, settings.GROQ_API_KEY_FALLBACK)
        res = _parse_json(out)
        if res:
            return res

    # Tier 3: Gemini Primary
    out = await call_gemini(prompt, system_prompt, settings.GEMINI_API_KEY)
    res = _parse_json(out)
    if res:
        return res

    # Tier 4: Gemini Fallback
    if settings.GEMINI_API_KEY_FALLBACK:
        out = await call_gemini(prompt, system_prompt, settings.GEMINI_API_KEY_FALLBACK)
        res = _parse_json(out)
        if res:
            return res

    return None
