import sys
from pathlib import Path

# Add root directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import os
import uvicorn

if __name__ == "__main__":
    is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production" or "--prod" in sys.argv
    workers = int(os.getenv("WEB_CONCURRENCY", "4" if is_prod else "1"))
    port = int(os.getenv("PORT", "8000"))

    print(f"[CreatorSpy AI] Starting FastAPI Server (env={'production' if is_prod else 'development'}, workers={workers}) on port {port}")
    print(f"[CreatorSpy AI] API Docs available at http://localhost:{port}/docs")
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not is_prod,
        workers=workers if is_prod else 1,
        log_level="info",
    )
