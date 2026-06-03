import ipaddress
import socket
from typing import Iterable, Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Request, status

from app.core.config import get_settings
from app.core.redis_client import redis_client


PRIVATE_HOSTNAMES = {"localhost", "localhost.localdomain"}


def client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(request: Request, action: str, limit: int, window_seconds: int) -> None:
    settings = get_settings()
    if not settings.RATE_LIMIT_ENABLED:
        return

    key = f"rate_limit:{action}:{client_ip(request)}"
    try:
        current = redis_client.incr(key)
        if current == 1:
            redis_client.expire(key, window_seconds)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Rate limiting is temporarily unavailable. Please try again.",
        ) from exc

    if current > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait and try again.",
        )


def apply_security_headers(response) -> None:
    headers = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    }
    for name, value in headers.items():
        if name not in response.headers:
            response.headers[name] = value


def _is_public_ip(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def assert_public_https_url(url: str, *, allowed_schemes: Optional[Iterable[str]] = None) -> None:
    schemes = set(allowed_schemes or {"https"})
    parsed = urlparse(url)
    if parsed.scheme not in schemes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only HTTPS public URLs are allowed.",
        )

    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname or hostname in PRIVATE_HOSTNAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only public hostnames are allowed.",
        )

    try:
        ipaddress.ip_address(hostname)
        addresses = [hostname]
    except ValueError:
        try:
            addresses = [info[4][0] for info in socket.getaddrinfo(hostname, None)]
        except socket.gaierror as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to resolve the requested hostname.",
            ) from exc

    if not addresses or any(not _is_public_ip(address) for address in set(addresses)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private or internal hostnames are not allowed.",
        )
