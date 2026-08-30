import sys
from pathlib import Path

# Ensure backend package is in sys.path
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app.main import app

# Cloudflare Workers ASGI entrypoint
try:
    from workers import asgi
    Default = asgi.entrypoint(app)
except ImportError:
    # Local development fallback
    Default = app
