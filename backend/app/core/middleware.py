import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings

EXEMPT_PATHS = {"/api/v1/health", "/docs", "/openapi.json", "/redoc", "/"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter, keyed by client IP."""

    def __init__(self, app, requests_per_minute: int | None = None):
        super().__init__(app)
        self.limit = requests_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.window_seconds = 60.0
        self._hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in EXEMPT_PATHS or self.limit <= 0:
            return await call_next(request)

        client_id = request.client.host if request.client else "unknown"
        now = time.monotonic()
        hits = self._hits[client_id]

        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()

        if len(hits) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please slow down and try again shortly."},
            )

        hits.append(now)
        return await call_next(request)
