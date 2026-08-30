import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClarifyAI - CreatorSpy Viral Intelligence Studio"
    SECRET_KEY: str = "creator-spy-ultra-secret-key-2026"
    
    # AI API Keys (Primary + Fallbacks)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_KEY_FALLBACK: str = os.getenv("GROQ_API_KEY_FALLBACK", "")
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEY_FALLBACK: str = os.getenv("GEMINI_API_KEY_FALLBACK", "")
    
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    HF_TOKEN_FALLBACK: str = os.getenv("HF_TOKEN_FALLBACK", "")
    
    # Search & YouTube Data APIs
    SERPER_API_KEY: str = os.getenv("SERPER_API_KEY", "")
    SERPER_API_KEY_FALLBACK: str = os.getenv("SERPER_API_KEY_FALLBACK", "")
    
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    TAVILY_API_KEY_FALLBACK: str = os.getenv("TAVILY_API_KEY_FALLBACK", "")
    
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
