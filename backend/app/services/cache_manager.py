import time
from typing import Any, Optional, Dict
from collections import OrderedDict
import asyncio

class InMemoryTTLCache:
    """
    High-performance, concurrency-safe in-memory LRU cache with TTL expiration.
    Guarantees sub-millisecond responses for repeated creator intelligence queries.
    """
    def __init__(self, max_size: int = 500, default_ttl_seconds: int = 600):
        self.max_size = max_size
        self.default_ttl = default_ttl_seconds
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            entry = self._cache[key]
            # Check expiration
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self._hits += 1
            return entry["data"]

    async def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        async with self._lock:
            ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
            expires_at = time.time() + ttl

            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = {"data": data, "expires_at": expires_at}

            # Evict oldest if exceeding capacity
            if len(self._cache) > self.max_size:
                self._cache.popitem(last=False)

    async def clear(self) -> None:
        async with self._lock:
            self._cache.clear()

    @property
    def stats(self) -> Dict[str, int]:
        return {
            "size": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
        }

# Global singleton cache instances
channel_cache = InMemoryTTLCache(max_size=300, default_ttl_seconds=900)  # 15 mins for channel searches
dossier_cache = InMemoryTTLCache(max_size=500, default_ttl_seconds=1800) # 30 mins for synthesized dossiers
hook_cache = InMemoryTTLCache(max_size=200, default_ttl_seconds=1800)    # 30 mins for adapted hooks
