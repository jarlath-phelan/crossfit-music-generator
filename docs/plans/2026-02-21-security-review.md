# Security Review: CrossFit Playlist Generator

**Date**: 2026-02-21
**Scope**: Full-stack security audit (FastAPI backend, Next.js frontend, auth, database)
**Reviewer**: Claude Code (automated review)

---

## Executive Summary

The codebase demonstrates good security fundamentals: server actions protect secrets from the client, CORS is explicitly scoped, Pydantic validates inputs, HMAC signing protects user identity claims, and Drizzle ORM prevents SQL injection. However, several issues need attention before production launch, including **2 CRITICAL**, **5 HIGH**, **6 MEDIUM**, and **5 LOW** severity findings.

---

## Findings

### 1. API Key & Secret Handling

#### 1.1 Error Handler Leaks Internal Exception Details to Client [HIGH]

**File**: `/apps/api/main.py`, lines 311-316

```python
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(
        status_code=500,
        detail=f"Failed to generate playlist: {str(e)}"
    )
```

The catch-all exception handler in `generate_playlist` passes `str(e)` directly into the HTTP 500 response. This can expose internal details such as file paths, database connection strings, API error messages from Anthropic/Spotify, and stack-level information.

**Severity**: HIGH
**Recommendation**: Return a generic error message to the client. Log the full exception server-side only.

```python
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(
        status_code=500,
        detail="Failed to generate playlist. Please try again."
    )
```

#### 1.2 Health Endpoint Leaks Exception Content [MEDIUM]

**File**: `/apps/api/main.py`, lines 158-164

```python
except Exception as e:
    logger.error(f"Health check failed: {e}")
    return {
        "status": "unhealthy",
        "agents": agent_status,
        "error": str(e)
    }
```

The `/health` endpoint returns raw exception strings. While health endpoints are typically internal, this one is publicly accessible and could leak internal state.

**Severity**: MEDIUM
**Recommendation**: Remove `"error": str(e)` from the health check response or restrict the endpoint.

#### 1.3 Root Endpoint Exposes Operational Configuration [LOW]

**File**: `/apps/api/main.py`, lines 107-124

The `GET /` endpoint reveals mock mode status, music source type, and whether Spotify is enabled. This helps attackers understand the application's configuration.

**Severity**: LOW
**Recommendation**: Remove `mock_mode` and `music_source` from the public root response, or require an API key to access them.

#### 1.4 .env Files Properly Gitignored [INFO]

**File**: `/.gitignore`, lines 41-45

The `.gitignore` correctly excludes `.env`, `.env*.local`, and variants. No `.env` files were found committed in git history. The `.env.example` and `.env.local.example` files use placeholder values only.

**Severity**: INFO (positive finding)

#### 1.5 `NEXT_PUBLIC_` Variables Expose Only URLs [INFO]

**Files**: `/apps/web/.env.local.example`, `/apps/web/app/actions.ts`, `/apps/web/lib/auth.ts`

Only `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` are prefixed with `NEXT_PUBLIC_`. These expose only URL endpoints, not secrets. `API_SHARED_SECRET`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, and Spotify credentials are all server-only.

**Severity**: INFO (positive finding)

---

### 2. CORS Configuration

#### 2.1 CORS Configuration Is Properly Scoped [INFO]

**File**: `/apps/api/main.py`, lines 91-104

```python
_allowed_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[...],
)
```

CORS is configured with explicit origins parsed from the `FRONTEND_URL` env var, not wildcards. Methods are restricted to GET, POST, OPTIONS. Credentials are allowed (needed for cookies/auth).

**Severity**: INFO (positive finding)

#### 2.2 Default FRONTEND_URL Includes Both Dev and Production [LOW]

**File**: `/apps/api/config.py`, line 40

```python
frontend_url: str = "http://localhost:3000,https://crossfit-music-generator.vercel.app"
```

The default value includes `localhost:3000`. In production, if the `FRONTEND_URL` env var is not explicitly set, the API would allow CORS from localhost origins.

**Severity**: LOW
**Recommendation**: Set the default to production-only, or remove the default entirely and require explicit configuration.

---

### 3. Authentication Flows

#### 3.1 Auth Route Returns 200 on Database Failure [HIGH]

**File**: `/apps/web/app/api/auth/[...all]/route.ts`, lines 22-26

```typescript
if (isDbConnectionError(error)) {
    console.error("[auth] Database connection error:", error);
    return Response.json(null, { status: 200 });
}
```

When the database is unreachable, the auth handler returns HTTP 200 with `null`. This means the client will interpret a database outage as "user is not authenticated" without any error signal. Worse, if `getSession()` returns null due to a DB failure during a `generatePlaylist` call, the request will proceed as unauthenticated -- silently losing user preferences and HMAC signing.

**Severity**: HIGH
**Recommendation**: Return HTTP 503 (Service Unavailable) for database connection errors instead of silently returning 200. This lets the client display an appropriate retry message.

```typescript
if (isDbConnectionError(error)) {
    console.error("[auth] Database connection error:", error);
    return Response.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
    );
}
```

#### 3.2 Session Duration Is 7 Days Without Rotation [MEDIUM]

**File**: `/apps/web/lib/auth.ts`, line 39

```typescript
session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
},
```

Sessions last 7 days without any evidence of session rotation or token refresh. If a session token is compromised, it remains valid for a full week.

**Severity**: MEDIUM
**Recommendation**: Enable Better Auth's `updateAge` option to rotate session tokens periodically (e.g., every 24 hours), and consider reducing the max lifetime to 3 days.

#### 3.3 No CSRF Protection Visible [MEDIUM]

The auth setup does not show explicit CSRF token validation. Better Auth may handle this internally for its own routes, but the server actions in `actions.ts` (which perform state-changing operations like `deletePlaylist`, `submitTrackFeedback`, `updateProfile`, `savePlaylist`) rely only on session cookies.

Next.js server actions include some built-in CSRF protection (Origin header checking), but this should be verified to be active in the deployment.

**Severity**: MEDIUM
**Recommendation**: Confirm that Next.js CSRF protection is active in the production configuration. Consider adding an explicit CSRF token if the deployment uses a reverse proxy that strips Origin headers.

---

### 4. Input Validation

#### 4.1 `image_media_type` Not Validated Against Allowlist [HIGH]

**File**: `/apps/api/models/schemas.py`, lines 121-124

```python
image_media_type: Optional[str] = Field(
    None,
    description="MIME type of the image (e.g. 'image/jpeg', 'image/png')"
)
```

The `image_media_type` field accepts any string. This value is passed directly to the Anthropic Vision API in `/apps/api/clients/anthropic_client.py` line 180:

```python
"media_type": media_type,
```

While the Anthropic API would reject invalid types, a malicious value could trigger unexpected behavior, and there is no server-side enforcement of allowed image types.

**Severity**: HIGH
**Recommendation**: Constrain `image_media_type` to a `Literal` type:

```python
image_media_type: Optional[Literal["image/jpeg", "image/png", "image/gif", "image/webp"]] = None
```

#### 4.2 `X-User-Min-Energy` Header Not Safely Parsed [MEDIUM]

**File**: `/apps/api/main.py`, line 240

```python
user_min_energy = float(user_min_energy_str) if user_min_energy_str else None
```

The `float()` conversion has no try/except. A malformed header value (e.g., `"abc"`) will cause an unhandled `ValueError` that propagates to the global exception handler, returning a 500 error with the exception message.

**Severity**: MEDIUM
**Recommendation**: Wrap in try/except and validate the range:

```python
try:
    user_min_energy = float(user_min_energy_str) if user_min_energy_str else None
    if user_min_energy is not None and not (0 <= user_min_energy <= 1):
        user_min_energy = None
except ValueError:
    user_min_energy = None
```

#### 4.3 `rating` Field Accepts Any Integer [MEDIUM]

**File**: `/apps/web/app/actions.ts`, lines 217-241

The `submitTrackFeedback` function accepts `rating: number` with no validation that it is -1 or 1. An attacker could submit arbitrary integers. While the downstream code only checks for `=== 1` and `=== -1`, polluted data accumulates in the database.

**Severity**: MEDIUM
**Recommendation**: Validate rating is exactly -1 or 1 before inserting:

```typescript
if (rating !== 1 && rating !== -1) throw new Error('Rating must be 1 or -1')
```

#### 4.4 SQL Injection Prevention via Drizzle ORM [INFO]

All database queries use Drizzle ORM's query builder with parameterized queries (`eq()`, `and()`, `.where()`). No raw SQL strings were found. This provides strong SQL injection protection.

**Severity**: INFO (positive finding)

#### 4.5 Pydantic Validates All Request Bodies [INFO]

The `GeneratePlaylistRequest` model enforces `min_length=5`, `max_length=5000` for workout text, and `max_length=14_000_000` for base64 images. The `Track`, `Phase`, and `WorkoutStructure` models use `Field` constraints with `gt=0`, `ge=0`, `le=1`, and `Literal` types for intensity levels.

**Severity**: INFO (positive finding)

---

### 5. Rate Limiting

#### 5.1 X-Forwarded-For Spoofable Without Trusted Proxy Configuration [CRITICAL]

**File**: `/apps/api/main.py`, lines 30-34

```python
def get_real_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
```

The rate limiter trusts the first IP in the `X-Forwarded-For` header unconditionally. Any client can spoof this header to bypass rate limiting entirely by sending a different fake IP with each request:

```
X-Forwarded-For: 1.2.3.4
X-Forwarded-For: 5.6.7.8
```

Fly.io adds its own `X-Forwarded-For` entry, but the **first** IP in the chain is the one set by the client. The correct approach is to trust the **last** (or Nth-from-last) IP, based on the number of trusted proxies.

**Severity**: CRITICAL
**Recommendation**: Use Fly.io's `Fly-Client-IP` header instead, which is set by the proxy and cannot be spoofed by the client:

```python
def get_real_client_ip(request: Request) -> str:
    # Fly.io sets this header directly from the connecting IP
    fly_ip = request.headers.get("fly-client-ip")
    if fly_ip:
        return fly_ip.strip()
    # Fallback for local development
    return request.client.host if request.client else "unknown"
```

Alternatively, if you must use `X-Forwarded-For`, take the **rightmost** IP minus the number of known proxies.

#### 5.2 Rate Limit Only on Generate Endpoint [LOW]

Only `POST /api/v1/generate` has a rate limit (`10/minute`). The health check, root endpoint, and any future endpoints have no rate protection. While these are lightweight, an unprotected health endpoint can be used for DDoS amplification.

**Severity**: LOW
**Recommendation**: Add a global rate limit (e.g., `100/minute`) in addition to the endpoint-specific one.

---

### 6. HMAC Implementation

#### 6.1 HMAC Verification Uses Correct Constant-Time Comparison [INFO]

**File**: `/apps/api/main.py`, lines 226-235

```python
if user_id and settings.api_shared_secret:
    signature = request.headers.get("X-User-Signature", "")
    expected = hmac.new(
        settings.api_shared_secret.encode(),
        user_id.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        logger.warning(f"Invalid HMAC signature for user {user_id}")
        user_id = None
```

The implementation uses `hmac.compare_digest()` which prevents timing attacks. The signing side in `actions.ts` uses Node.js `createHmac('sha256', ...)` which is compatible. Both sides produce hex-encoded SHA-256 digests.

**Severity**: INFO (positive finding)

#### 6.2 HMAC Only Signs User ID, Not Full Request [MEDIUM]

The HMAC signature covers only `X-User-ID`. The other custom headers (`X-User-Genre`, `X-User-Exclude-Artists`, `X-User-Min-Energy`, `X-User-Boost-Artists`, `X-User-Hidden-Tracks`) are unsigned. If an attacker can intercept and modify the request between Vercel and Fly.io (e.g., via a misconfigured TLS termination), they could alter user preferences without detection.

**Severity**: MEDIUM
**Recommendation**: Sign a concatenation of all user preference headers, or include a timestamp and the full request body hash in the HMAC to prevent replay and tampering.

#### 6.3 HMAC Secret Is Optional [HIGH]

**File**: `/apps/api/config.py`, line 26 and `/apps/api/main.py`, line 226

```python
api_shared_secret: Optional[str] = None  # HMAC shared secret with frontend
```

```python
if user_id and settings.api_shared_secret:
```

If `API_SHARED_SECRET` is not set, HMAC verification is completely bypassed. The backend accepts any `X-User-ID` header at face value. An attacker who discovers the API endpoint could impersonate any user by setting `X-User-ID: <victim-id>`.

**Severity**: HIGH
**Recommendation**: Either (a) require `API_SHARED_SECRET` in production (fail startup without it), or (b) reject all `X-User-ID` headers when no shared secret is configured:

```python
if user_id and not settings.api_shared_secret:
    logger.warning("X-User-ID received but API_SHARED_SECRET not configured; ignoring")
    user_id = None
```

---

### 7. Spotify Token Handling

#### 7.1 Spotify Access Token Passes Through Client State [CRITICAL]

**Files**: `/apps/web/app/actions.ts` (line 34-48), `/apps/web/app/(tabs)/generate/page.tsx` (lines 84-103), `/apps/web/hooks/use-spotify-player.ts`

The flow is:

1. Server action `getSpotifyAccessToken()` fetches the Spotify OAuth access token from Better Auth's token store (server-side).
2. It returns the raw access token string to the client component.
3. The client component stores it in React state (`spotifyToken`) and passes it to the Spotify Web Playback SDK and direct Spotify API calls.

```typescript
// page.tsx (client)
const token = await getSpotifyAccessToken()
setSpotifyToken(token)
```

```typescript
// use-spotify-player.ts (client)
Authorization: `Bearer ${accessToken}`,
```

This is a necessary pattern for the Spotify Web Playback SDK (which must run in the browser), but it has significant implications:

- The Spotify access token is exposed in the browser's JavaScript memory and can be extracted by browser extensions, XSS attacks, or devtools.
- The token has broad scopes: `streaming`, `user-modify-playback-state`, `playlist-modify-public`, `playlist-modify-private`.
- The token is refreshed on a 50-minute interval (`setInterval(fetchToken, 50 * 60 * 1000)`) but there is no revocation mechanism if the user logs out.

**Severity**: CRITICAL
**Recommendation**:
1. Reduce Spotify scopes to only what is needed. `playlist-modify-public` can likely be removed (playlists are created as private).
2. Add token revocation on logout -- call the server action to invalidate the stored Spotify token when the user signs out.
3. Consider proxying Spotify API calls (playlist creation, track addition) through the server action rather than exposing the token to the client. The `exportToSpotify` function already does this correctly, but the Playback SDK requires client-side tokens by design.
4. Reduce the `playlist-modify-public` scope since playlists are created with `public: false`.

---

### 8. Dependency Vulnerabilities

#### 8.1 Backend Dependencies Use Older Versions [MEDIUM]

**File**: `/apps/api/requirements.txt`

| Package | Pinned Version | Latest (Feb 2026) | Risk |
|---------|---------------|-------------------|------|
| `fastapi` | `0.104.1` | ~0.115+ | Missing security patches, Pydantic v2 improvements |
| `uvicorn[standard]` | `0.24.0` | ~0.34+ | Missing HTTP parsing fixes |
| `anthropic` | `0.34.0` | ~0.49+ | Missing client improvements |
| `pydantic` | `2.5.0` | ~2.10+ | Missing validation fixes |
| `slowapi` | `0.1.9` | ~0.1.9 | Appears current |

The versions are over 2 years old. While no specific CVEs were identified in this quick check, older FastAPI and uvicorn versions may have unpatched HTTP parsing or CORS-related fixes.

**Severity**: MEDIUM
**Recommendation**: Run `pip audit` against the requirements to check for known CVEs. Update at minimum `fastapi`, `uvicorn`, and `pydantic` to their latest minor releases.

#### 8.2 Frontend Dependencies Are Reasonably Current [INFO]

**File**: `/apps/web/package.json`

Next.js `^16.1.6`, React `^19.0.0`, Better Auth `^1.4.18`, and Drizzle ORM `^0.45.1` are all recent versions. No critical CVEs were identified in a surface-level review.

**Severity**: INFO

---

### 9. Environment Variable Exposure

Covered in finding 1.5 above. Only non-sensitive URL values use the `NEXT_PUBLIC_` prefix. All secrets remain server-side.

---

### 10. Server-Side Request Forgery (SSRF)

#### 10.1 `NEXT_PUBLIC_API_URL` Used in Server-Side Fetch [LOW]

**File**: `/apps/web/app/actions.ts`, line 11

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

The API URL is read from an environment variable and used in server-side `fetch()` calls. Since this is an environment variable (not user input), it cannot be manipulated at runtime. However, the `NEXT_PUBLIC_` prefix means it is also exposed to the client, which unnecessarily reveals the backend URL.

**Severity**: LOW
**Recommendation**: Rename to `API_URL` (no `NEXT_PUBLIC_` prefix) since it is only used in server actions, not client components.

#### 10.2 `X-Music-Source` Header Parsed But Not Used [LOW]

**File**: `/apps/api/main.py`, lines 243-250

```python
music_source_override = request.headers.get("X-Music-Source")
if music_source_override:
    logger.info(f"Music source override requested: {music_source_override}")
```

The header is read and logged, but never actually used to override the music source. This is dead code, but if it were implemented naively, it could allow an attacker to force the backend to use external API services, potentially causing cost or rate limit issues.

**Severity**: LOW
**Recommendation**: Either implement the override with proper validation (allowlist of `mock`, `getsongbpm`, `soundnet`, `claude`) or remove the dead code to reduce the attack surface.

---

### 11. File Upload Security

#### 11.1 Base64 Image Size Limit Is Generous but Present [LOW]

**File**: `/apps/api/models/schemas.py`, lines 116-119

```python
workout_image_base64: Optional[str] = Field(
    None,
    max_length=14_000_000,  # ~10MB base64
)
```

The 14MB base64 limit (~10MB decoded) is reasonable for whiteboard photos but could be used for memory exhaustion if many concurrent requests arrive. Combined with the rate limit of 10/minute per IP, this creates a theoretical 140MB/minute memory pressure per IP.

**Severity**: LOW
**Recommendation**: This is acceptable for the current scale. If traffic grows, consider adding a global request body size limit at the reverse proxy level (Fly.io).

#### 11.2 No Server-Side Image Content Validation [MEDIUM]

The `image_media_type` is not validated (see finding 4.1), and the base64 content is not checked to actually be a valid image. A crafted payload with valid base64 but non-image content would be passed directly to the Anthropic API.

**Severity**: MEDIUM (combined with finding 4.1)
**Recommendation**: Validate the base64 decodes successfully and optionally check magic bytes match the declared MIME type.

---

### 12. Error Information Disclosure

Covered in findings 1.1 and 1.2 above. Summary:
- `generate_playlist` leaks `str(e)` to clients (HIGH)
- Health check leaks `str(e)` to clients (MEDIUM)
- Global exception handler correctly returns generic message (positive)

---

### 13. Additional Findings

#### 13.1 Swagger/OpenAPI Docs Enabled in Production [MEDIUM]

**File**: `/apps/api/main.py`, lines 80-85

```python
app = FastAPI(
    title="CrossFit Playlist Generator API",
    description="Generate workout playlists from CrossFit workout text or photos",
    version="3.0.0",
    lifespan=lifespan
)
```

FastAPI serves Swagger UI at `/docs` and ReDoc at `/redoc` by default. In production, this exposes the full API schema, request/response models, and endpoint details to anyone.

**Severity**: MEDIUM
**Recommendation**: Disable docs in production:

```python
app = FastAPI(
    ...
    docs_url="/docs" if settings.log_level == "debug" else None,
    redoc_url=None,
)
```

#### 13.2 No Security Headers on Backend Responses [MEDIUM]

**File**: `/apps/api/main.py`

The backend does not set security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, or `Content-Security-Policy`.

While the frontend (Vercel) may add some of these, the backend API itself serves JSON responses without these protections. If any endpoint ever returns HTML, it would be vulnerable to MIME-type sniffing and clickjacking.

**Severity**: MEDIUM
**Recommendation**: Add security headers via middleware:

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response
```

#### 13.3 No Security Headers on Frontend [LOW]

**File**: `/apps/web/next.config.js`

The Next.js config only sets headers for the service worker file. No global security headers (`Content-Security-Policy`, `X-Frame-Options`, etc.) are configured. Vercel adds some headers by default, but a `Content-Security-Policy` would provide defense-in-depth against XSS.

**Severity**: LOW
**Recommendation**: Add security headers in `next.config.js`:

```javascript
async headers() {
    return [
        {
            source: '/(.*)',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            ],
        },
        // ... existing sw.js headers
    ]
}
```

#### 13.4 Dockerfile Runs as Root [LOW]

**File**: `/apps/api/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

The container runs as the root user. If the application is compromised, the attacker has root access inside the container.

**Severity**: LOW
**Recommendation**: Add a non-root user:

```dockerfile
RUN adduser --disabled-password --gecos '' appuser
USER appuser
```

#### 13.5 `uvicorn --reload` in Development Entry Point [INFO]

**File**: `/apps/api/main.py`, lines 332-340

```python
if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True, ...)
```

The `reload=True` flag is only active when running `python main.py` directly (development). The Dockerfile uses `uvicorn main:app` without `--reload`, which is correct for production.

**Severity**: INFO (no issue)

---

## Summary Table

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 5.1 | X-Forwarded-For spoofable without trusted proxy config | CRITICAL | Must fix |
| 7.1 | Spotify access token with broad scopes exposed to client | CRITICAL | Must fix |
| 1.1 | Exception messages leaked to HTTP responses | HIGH | Must fix |
| 3.1 | Auth route returns 200 on DB failure (silent auth bypass) | HIGH | Must fix |
| 4.1 | `image_media_type` not validated against allowlist | HIGH | Must fix |
| 6.3 | HMAC shared secret is optional (user impersonation risk) | HIGH | Must fix |
| 3.2 | 7-day session without rotation | MEDIUM | Should fix |
| 3.3 | No explicit CSRF protection visible | MEDIUM | Should fix |
| 4.2 | `X-User-Min-Energy` header not safely parsed | MEDIUM | Should fix |
| 4.3 | `rating` field accepts any integer | MEDIUM | Should fix |
| 6.2 | HMAC signs only user ID, not full request | MEDIUM | Should fix |
| 8.1 | Backend dependencies use older versions | MEDIUM | Should fix |
| 11.2 | No server-side image content validation | MEDIUM | Should fix |
| 13.1 | Swagger/OpenAPI docs enabled in production | MEDIUM | Should fix |
| 13.2 | No security headers on backend responses | MEDIUM | Should fix |
| 1.2 | Health endpoint leaks exception content | MEDIUM | Should fix |
| 1.3 | Root endpoint exposes operational config | LOW | Nice to fix |
| 2.2 | Default FRONTEND_URL includes localhost | LOW | Nice to fix |
| 5.2 | Rate limit only on generate endpoint | LOW | Nice to fix |
| 10.1 | `NEXT_PUBLIC_API_URL` unnecessarily public | LOW | Nice to fix |
| 10.2 | `X-Music-Source` header dead code | LOW | Nice to fix |
| 11.1 | Base64 image size limit generous but present | LOW | Acceptable |
| 13.3 | No security headers on frontend | LOW | Nice to fix |
| 13.4 | Dockerfile runs as root | LOW | Nice to fix |
| 1.4 | .env files properly gitignored | INFO | No action |
| 1.5 | NEXT_PUBLIC_ vars expose only URLs | INFO | No action |
| 2.1 | CORS properly scoped | INFO | No action |
| 4.4 | SQL injection prevented by Drizzle ORM | INFO | No action |
| 4.5 | Pydantic validates all request bodies | INFO | No action |
| 6.1 | HMAC uses constant-time comparison | INFO | No action |
| 8.2 | Frontend dependencies reasonably current | INFO | No action |
| 13.5 | `--reload` only in dev entry point | INFO | No action |

---

## Recommended Fix Order

**Before launch (blocking)**:
1. Fix X-Forwarded-For rate limiter spoofing (5.1) -- use `Fly-Client-IP`
2. Require `API_SHARED_SECRET` in production (6.3) -- prevent user impersonation
3. Remove `str(e)` from HTTP error responses (1.1, 1.2)
4. Validate `image_media_type` against allowlist (4.1)
5. Fix auth route DB failure handling (3.1)
6. Remove `playlist-modify-public` Spotify scope (7.1)

**Before first paying customer (important)**:
7. Add security headers to backend (13.2) and frontend (13.3)
8. Disable Swagger docs in production (13.1)
9. Add safe parsing for header values (4.2)
10. Validate rating values (4.3)
11. Update backend dependencies (8.1)
12. Add non-root user to Dockerfile (13.4)

**When scaling**:
13. Expand HMAC to cover all preference headers (6.2)
14. Add session rotation (3.2)
15. Add global rate limiting (5.2)
16. Rename `NEXT_PUBLIC_API_URL` to `API_URL` (10.1)
