"""Load environment variables for MongoDB and other settings."""

import os
from pathlib import Path

# Load .env from project root (when running as installed app, cwd is often user dir)
_env_paths = [
    Path.cwd() / ".env",
    Path(__file__).resolve().parent.parent / ".env",
]
for _p in _env_paths:
    if _p.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(_p)
        except ImportError:
            pass
        break

# MongoDB
MONGODB_URI = os.environ.get("MONGODB_URI", "")


def get_mongodb_uri() -> str:
    """Return MongoDB connection URI from environment. Raises if not set."""
    uri = (os.environ.get("MONGODB_URI") or "").strip()
    if not uri:
        raise ValueError(
            "MONGODB_URI is not set. Copy .env.example to .env and set your MongoDB connection string."
        )
    return uri
