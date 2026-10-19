import threading
import time

from fastapi import Request

from app.core.config import settings


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 120, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, client_ip: str) -> tuple[bool, int, int, int]:
        with self._lock:
            now = time.time()
            cutoff = now - self.window_seconds
            timestamps = [ts for ts in self._requests.get(client_ip, []) if ts > cutoff]

            if len(timestamps) >= self.max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(oldest + self.window_seconds - now) + 1)
                reset_epoch = int(oldest + self.window_seconds)
                self._requests[client_ip] = timestamps
                return False, 0, retry_after, reset_epoch

            timestamps.append(now)
            self._requests[client_ip] = timestamps
            remaining = max(0, self.max_requests - len(timestamps))
            reset_epoch = int(timestamps[0] + self.window_seconds)
            return True, remaining, 0, reset_epoch

    def reset(self) -> None:
        with self._lock:
            self._requests.clear()
            self.max_requests = settings.RATE_LIMIT_PER_MINUTE
            self.window_seconds = 60


rate_limiter = SlidingWindowRateLimiter(
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60,
)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        parts = forwarded.split(",")
        first = parts[0].strip()
        if first:
            return first

    if request.client and request.client.host:
        return request.client.host

    return "unknown"
