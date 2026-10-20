"""CORS settings for the API."""

import re
from typing import Any, Dict, Optional

# Local development: Next.js moves to port 3001 (and up) when 3000 is busy, so allow any localhost port.
LOCALHOST_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"


def cors_settings(allow_origins: Optional[str]) -> Dict[str, Any]:
    """Keyword arguments for CORSMiddleware.

    ``allow_origins`` is the ALLOW_ORIGINS environment variable: a comma-separated list of exact
    origins, used as given. When it is unset, only localhost origins on any port are allowed, which
    suits local development and nothing else; deployments should set it explicitly.
    """
    origins = [origin.strip() for origin in (allow_origins or "").split(",") if origin.strip()]
    if origins:
        return {"allow_origins": origins}
    return {"allow_origins": [], "allow_origin_regex": LOCALHOST_ORIGIN_REGEX}


def is_allowed_by_default(origin: str) -> bool:
    return re.fullmatch(LOCALHOST_ORIGIN_REGEX, origin) is not None
