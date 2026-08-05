"""AI-powered endpoints for the Bitcoin Counters minting assistant.

Three endpoints — all proxied through the Python server so ANTHROPIC_API_KEY
never touches the frontend JS bundle:

  POST /ai/mint-parse    — natural language → mint params (asset, supply, divisible)
  GET  /ai/fee-advice    — mempool tiers + AI recommendation + estimated cost
  POST /ai/name-suggest  — file content → 3 Counterparty-valid asset name suggestions

All endpoints return JSON. Rate-limited per IP (token bucket, stdlib only).
ANTHROPIC_API_KEY must be set in the environment — endpoints 503 if absent.

Integration into app.py:
  from .ai_routes import handle_ai
  # In Handler.do_GET / do_POST, before the static fallback:
  if path.startswith('/ai/'):
      return handle_ai(self, path, method)
"""

from __future__ import annotations

import json
import logging
import os
import time
from http.server import BaseHTTPRequestHandler

log = logging.getLogger("counters.ai")

# ---------------------------------------------------------------------------
# Rate limiter — simple per-IP token bucket, no external deps
# ---------------------------------------------------------------------------

_BUCKET_CAPACITY = 10       # max burst
_BUCKET_RATE = 1 / 5        # 1 token per 5 seconds per IP
_buckets: dict[str, tuple[float, float]] = {}  # ip -> (tokens, last_refill_ts)


def _allow(ip: str) -> bool:
    now = time.monotonic()
    tokens, last = _buckets.get(ip, (_BUCKET_CAPACITY, now))
    tokens = min(_BUCKET_CAPACITY, tokens + (now - last) * _BUCKET_RATE)
    if tokens < 1:
        _buckets[ip] = (tokens, now)
        return False
    _buckets[ip] = (tokens - 1, now)
    return True


# ---------------------------------------------------------------------------
# Anthropic client — lazy, so missing key only errors on first call
# ---------------------------------------------------------------------------

def _anthropic():
    try:
        import anthropic  # type: ignore[import]
        return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    except KeyError:
        return None
    except ImportError:
        log.warning("anthropic package not installed; pip install anthropic")
        return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ASSET_RE = __import__("re").compile(r"^[A-Z]{4,12}$")
_RESERVED = {"BTC", "XCP"}


def _valid_asset_name(name: str) -> bool:
    return bool(_ASSET_RE.match(name)) and name not in _RESERVED


def _ask(client, system: str, user: str, max_tokens: int = 256) -> str:
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text.strip()


# ---------------------------------------------------------------------------
# Endpoint handlers
# ---------------------------------------------------------------------------

def _mint_parse(handler: BaseHTTPRequestHandler) -> None:
    """POST /ai/mint-parse  body: {"text": "..."} → mint params JSON."""
    length = int(handler.headers.get("Content-Length", 0))
    body = handler.rfile.read(length)
    try:
        data = json.loads(body)
        text = str(data.get("text", ""))[:500]
    except (json.JSONDecodeError, KeyError):
        _json(handler, {"error": "invalid request"}, 400)
        return

    client = _anthropic()
    if not client:
        _json(handler, {"error": "AI unavailable"}, 503)
        return

    system = (
        "You extract Bitcoin Counters minting parameters from natural language. "
        "Reply with a single JSON object and no other text:\n"
        '{"asset": "<4-12 uppercase letters, Counterparty-valid name or null>", '
        '"supply": <integer 1-1000000000 or null>, '
        '"divisible": <true|false|null>}\n'
        "Rules: named assets are 4-12 uppercase letters (not BTC or XCP). "
        "Numeric assets (A + number) are free — use null for asset if the user wants a free numeric one. "
        "divisible=false for art/collectibles, true for currency/tokens."
    )
    raw = _ask(client, system, text)
    try:
        params = json.loads(raw)
        if params.get("asset") and not _valid_asset_name(params["asset"]):
            params["asset"] = None
            params["asset_note"] = "Suggested name was invalid; use a numeric asset or pick a 4-12 letter name."
        _json(handler, params)
    except json.JSONDecodeError:
        _json(handler, {"error": "AI returned unparseable response", "raw": raw}, 500)


def _fee_advice(handler: BaseHTTPRequestHandler) -> None:
    """GET /ai/fee-advice → mempool tiers + AI recommendation."""
    import urllib.request

    # Fetch mempool.space fee tiers
    mempool: dict = {}
    try:
        req = urllib.request.urlopen(
            "https://mempool.space/api/v1/fees/recommended", timeout=5
        )
        mempool = json.loads(req.read())
        # keys: fastestFee, halfHourFee, hourFee, economyFee, minimumFee
    except Exception as e:
        log.debug("mempool.space fetch failed: %s", e)

    fastest = mempool.get("fastestFee", "?")
    hour = mempool.get("hourFee", "?")
    economy = mempool.get("economyFee", "?")

    client = _anthropic()
    reasoning = ""
    recommendation = "economy"
    if client and mempool:
        system = (
            "You are a Bitcoin fee advisor. Given current mempool fee tiers "
            "(sat/vB), recommend one of: 'fastest', 'standard', or 'economy'. "
            "Reply with JSON only: "
            '{"recommendation": "fastest"|"standard"|"economy", "reasoning": "<1 sentence>"}'
        )
        user = (
            f"fastest={fastest} sat/vB, 1-hour={hour} sat/vB, economy={economy} sat/vB. "
            "The user is inscribing a Bitcoin Counter (a taproot reveal tx, ~600-700 vB). "
            "Recommend the best tier for a non-urgent inscription."
        )
        try:
            raw = _ask(client, system, user)
            parsed = json.loads(raw)
            recommendation = parsed.get("recommendation", "economy")
            reasoning = parsed.get("reasoning", "")
        except Exception:
            reasoning = "Could not generate AI reasoning."

    fee_map = {"fastest": fastest, "standard": hour, "economy": economy}
    chosen_rate = fee_map.get(recommendation, economy)
    estimated_cost = (
        int(chosen_rate) * 650 if isinstance(chosen_rate, (int, float)) else None
    )

    _json(handler, {
        "mempool": {"fastest": fastest, "hour": hour, "economy": economy},
        "recommendation": recommendation,
        "reasoning": reasoning,
        "estimated_cost_sats": estimated_cost,
    })


def _name_suggest(handler: BaseHTTPRequestHandler) -> None:
    """POST /ai/name-suggest  body: {"filename": "...", "mime": "...", "preview": "..."}
    → {"names": ["NAME1", "NAME2", "NAME3"]}"""
    length = int(handler.headers.get("Content-Length", 0))
    body = handler.rfile.read(length)
    try:
        data = json.loads(body)
        filename = str(data.get("filename", ""))[:100]
        mime = str(data.get("mime", ""))[:60]
        preview = str(data.get("preview", ""))[:300]
    except (json.JSONDecodeError, KeyError):
        _json(handler, {"error": "invalid request"}, 400)
        return

    client = _anthropic()
    if not client:
        _json(handler, {"error": "AI unavailable"}, 503)
        return

    system = (
        "Suggest 3 Counterparty asset names for a Bitcoin Counter inscription. "
        "Rules: exactly 4-12 uppercase Latin letters, no numbers, not BTC or XCP. "
        "Make names memorable, relevant to the content, and short. "
        'Reply with JSON only: {"names": ["NAME1", "NAME2", "NAME3"]}'
    )
    user = f"filename={filename!r}, mime={mime!r}, content preview={preview!r}"
    try:
        raw = _ask(client, system, user)
        result = json.loads(raw)
        names = [n for n in result.get("names", []) if _valid_asset_name(str(n))][:3]
        _json(handler, {"names": names})
    except Exception:
        _json(handler, {"error": "AI returned unparseable response"}, 500)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

def handle_ai(handler: BaseHTTPRequestHandler, path: str, method: str) -> bool:
    """Call from Handler.do_GET / do_POST. Returns True if the request was handled."""
    if not path.startswith("/ai/"):
        return False  # path check before rate limit — don't burn tokens on non-AI paths

    ip = handler.client_address[0]
    if not _allow(ip):
        _json(handler, {"error": "rate limited"}, 429)
        return True

    if path == "/ai/fee-advice" and method == "GET":
        _fee_advice(handler)
        return True
    if path == "/ai/mint-parse" and method == "POST":
        _mint_parse(handler)
        return True
    if path == "/ai/name-suggest" and method == "POST":
        _name_suggest(handler)
        return True
    return False


def _json(handler: BaseHTTPRequestHandler, obj: dict, status: int = 200) -> None:
    body = json.dumps(obj).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)
