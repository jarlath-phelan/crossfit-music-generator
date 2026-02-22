# Go Live Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the CrossFit Playlist Generator with real APIs (Anthropic, Spotify, GetSongBPM, SoundNet) on Fly.io, with per-request music source toggling.

**Architecture:** FastAPI backend on Fly.io (always-on), Next.js frontend on Vercel, Supabase PostgreSQL for auth/data. Three-agent pipeline: Claude parses workout → music source finds BPM tracks → scorer ranks and composes playlist → Spotify resolves URIs.

**Tech Stack:** Python 3.11, FastAPI, Next.js 16, React 19, Tailwind v4, Better Auth, Drizzle ORM, Supabase PostgreSQL, Fly.io, Vercel.

---

## Phase 1: Must-Haves (Go Live)

### Task 1: Add X-Music-Source Header Support (Backend)

**Files:**
- Modify: `apps/api/main.py:87-93` (CORS allowed headers)
- Modify: `apps/api/main.py:185-289` (generate endpoint)
- Modify: `apps/api/agents/music_curator.py:13-28` (factory function)
- Test: `apps/api/tests/test_api.py`

**Step 1: Write the failing test**

Add to `apps/api/tests/test_api.py`:

```python
def test_music_source_header_override(client):
    """X-Music-Source header should override the default music source."""
    response = client.post(
        "/api/v1/generate",
        json={"workout_text": "5 rounds of 10 push-ups"},
        headers={"X-Music-Source": "mock"},
    )
    assert response.status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && source venv/bin/activate && pytest tests/test_api.py::test_music_source_header_override -v`
Expected: Should pass or fail depending on CORS — the actual logic change is small.

**Step 3: Add X-Music-Source to CORS allowed headers**

In `apps/api/main.py`, add `"X-Music-Source"` to the `allow_headers` list in the CORS middleware config.

**Step 4: Add music source override parameter to create_music_source**

In `apps/api/agents/music_curator.py`, modify `create_music_source()` to accept an optional `source_override: str | None = None` parameter. If provided, use it instead of `settings.music_source`.

**Step 5: Wire X-Music-Source header into the generate endpoint**

In `apps/api/main.py`, in the `generate_playlist` function:
- Read `request.headers.get("X-Music-Source")`
- If present, create a new `MusicCuratorAgent` with the overridden source for this request
- Otherwise use the global `music_curator`

**Step 6: Run tests to verify**

Run: `cd apps/api && source venv/bin/activate && pytest tests/ -v`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add apps/api/main.py apps/api/agents/music_curator.py apps/api/tests/test_api.py
git commit -m "feat(api): add X-Music-Source header for per-request music source toggle"
```

---

### Task 2: Create Dockerfile for Fly.io

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`

**Step 1: Create .dockerignore**

```
__pycache__
*.pyc
.env
.env.*
venv/
.pytest_cache/
tests/
*.md
.git
```

**Step 2: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 3: Test Docker build locally**

Run: `cd apps/api && docker build -t crossfit-api . && docker run --rm -p 8000:8000 -e USE_MOCK_ANTHROPIC=true -e USE_MOCK_SPOTIFY=true crossfit-api`
Expected: Server starts, `curl http://localhost:8000/` returns API info JSON.

**Step 4: Commit**

```bash
git add apps/api/Dockerfile apps/api/.dockerignore
git commit -m "chore(api): add Dockerfile for Fly.io deployment"
```

---

### Task 3: Create fly.toml and Deploy to Fly.io

**Files:**
- Create: `apps/api/fly.toml`

**Step 1: Create fly.toml**

```toml
app = "crossfit-playlist-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = "off"
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

**Step 2: Launch the app on Fly.io**

Run: `cd apps/api && fly launch --no-deploy` (follow prompts, select app name)
Note: The app name may need to be unique. Adjust `fly.toml` if Fly assigns a different name.

**Step 3: Set secrets on Fly.io**

The user must provide their actual API keys. Run these commands with real values:

```bash
cd apps/api
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  SPOTIFY_CLIENT_ID=... \
  SPOTIFY_CLIENT_SECRET=... \
  GETSONGBPM_API_KEY=... \
  SOUNDNET_API_KEY=... \
  USE_MOCK_ANTHROPIC=false \
  USE_MOCK_SPOTIFY=false \
  MUSIC_SOURCE=getsongbpm \
  FRONTEND_URL=https://crossfit-music-generator.vercel.app \
  LOG_LEVEL=info
```

**Step 4: Deploy**

Run: `cd apps/api && fly deploy`
Expected: Build succeeds, deployment shows healthy.

**Step 5: Verify deployment**

Run: `curl https://crossfit-playlist-api.fly.dev/` and `curl https://crossfit-playlist-api.fly.dev/health`
Expected: Both return JSON with `mock_mode.anthropic: false`, `mock_mode.spotify: false`, `music_source: "getsongbpm"`.

**Step 6: Commit**

```bash
git add apps/api/fly.toml
git commit -m "chore(api): add fly.toml for Fly.io deployment"
```

---

### Task 4: Fix Spotify Redirect URI for Production

**Files:**
- Modify: `apps/api/config.py:15`

**Step 1: Make redirect URI configurable**

In `apps/api/config.py`, change line 15 from:
```python
spotify_redirect_uri: str = "http://localhost:8000/api/v1/spotify/callback"
```
to:
```python
spotify_redirect_uri: str = "http://localhost:8000/api/v1/spotify/callback"  # Override via SPOTIFY_REDIRECT_URI env var
```

This already works via pydantic-settings — `SPOTIFY_REDIRECT_URI` env var will override the default. Just need to set it in Fly.io secrets.

**Step 2: Set production redirect URI on Fly.io**

Run: `cd apps/api && fly secrets set SPOTIFY_REDIRECT_URI=https://crossfit-playlist-api.fly.dev/api/v1/spotify/callback`

**Step 3: Update Spotify Developer Dashboard**

Manual step: Log into https://developer.spotify.com/dashboard, select the app, go to Settings → Redirect URIs. Add:
- `https://crossfit-playlist-api.fly.dev/api/v1/spotify/callback`
- `https://crossfit-music-generator.vercel.app/api/auth/callback/spotify` (for Better Auth frontend OAuth)

Keep `http://localhost:8000/api/v1/spotify/callback` and `http://localhost:3000/api/auth/callback/spotify` for local dev.

**Step 4: Commit**

```bash
git add apps/api/config.py
git commit -m "docs(api): clarify spotify_redirect_uri is overridable via env var"
```

---

### Task 5: Update Frontend to Point at Fly.io Backend

**Files:**
- Modify: Vercel environment variables (dashboard, not code)
- Modify: `apps/web/app/actions.ts` (add X-Music-Source header)

**Step 1: Set Vercel environment variables**

Manual step in Vercel Dashboard (Settings → Environment Variables):
- `NEXT_PUBLIC_API_URL` = `https://crossfit-playlist-api.fly.dev`
- `BETTER_AUTH_SECRET` = (generate with `openssl rand -hex 32`)
- `DATABASE_URL` = (Supabase connection string — already known)
- `SPOTIFY_CLIENT_ID` = (same as backend)
- `SPOTIFY_CLIENT_SECRET` = (same as backend)
- `NEXT_PUBLIC_APP_URL` = `https://crossfit-music-generator.vercel.app`

**Step 2: Add X-Music-Source header to server action**

In `apps/web/app/actions.ts`, in the `generatePlaylist` function, add after the profile header block (around line 145):

```typescript
// Default music source — will be user-configurable in fast follow
fetchHeaders['X-Music-Source'] = 'getsongbpm'
```

**Step 3: Redeploy frontend**

Run: `cd apps/web && vercel --prod` (or push to main for auto-deploy)

**Step 4: Commit**

```bash
git add apps/web/app/actions.ts
git commit -m "feat(web): send X-Music-Source header to backend, default to getsongbpm"
```

---

### Task 6: Verify Database and Auth

**Step 1: Check if migrations have been applied**

Run: `cd apps/web && npx drizzle-kit push`
Expected: Either "Nothing to push" (already applied) or applies the schema.

**Step 2: Verify auth flow on production**

Manual test:
1. Visit https://crossfit-music-generator.vercel.app
2. Click "Sign in with Spotify"
3. Authorize the app
4. Verify redirect back to the app with a session

**Step 3: Verify database writes**

Manual test:
1. While signed in, generate a playlist
2. Save it to library
3. Navigate to Library page
4. Verify the playlist appears
5. Give a track thumbs up/down
6. Generate another playlist — verify feedback affects results

---

### Task 7: End-to-End Verification

**Step 1: Text input → playlist generation**

Manual test:
1. Enter: "21-15-9 thrusters 95lbs and pull-ups"
2. Wait for Claude to parse (may take 2-5 seconds with real API)
3. Verify workout structure shows correct phases
4. Verify playlist has tracks with real BPM data from GetSongBPM

**Step 2: Photo input → playlist generation**

Manual test:
1. Take a photo of a whiteboard with a workout written on it (or use camera)
2. Submit the image
3. Verify Claude Vision parses the workout correctly
4. Verify playlist generates successfully

**Step 3: Spotify playback**

Manual test:
1. Sign in with Spotify
2. Generate a playlist
3. Click play on a track — verify Spotify Web Playback SDK works
4. Test seek bar and volume controls
5. Test phase indicator arc display

**Step 4: Spotify export**

Manual test:
1. With a generated playlist, click "Export to Spotify"
2. Verify a new playlist appears in your Spotify account
3. Verify tracks are correct

**Step 5: Verify health endpoint**

Run: `curl https://crossfit-playlist-api.fly.dev/health`
Expected: All agents healthy, mock_mode false, spotify_enabled true.

---

## Phase 2: Fast Follows (can start in parallel with Phase 1)

### Task 8: Music Source Selector in UI

**Files:**
- Modify: `apps/web/app/actions.ts` (accept music source parameter)
- Modify: `apps/web/app/generate/page.tsx` (add dropdown)
- Modify: `apps/web/app/profile/page.tsx` (add default preference)

Add a dropdown on the generate page allowing users to choose between:
- GetSongBPM (default) — "Verified BPM database"
- SoundNet — "Audio analysis"
- Claude — "AI suggestions (experimental)"

Store the preference in the coach profile. Pass it via X-Music-Source header.

---

### Task 9: Startup API Key Validation

**Files:**
- Modify: `apps/api/main.py:38-67` (lifespan function)
- Modify: `apps/api/config.py:46-58` (validate_api_keys)

Enhance `validate_api_keys()` to also check music source keys:
- If `MUSIC_SOURCE=getsongbpm`, require `GETSONGBPM_API_KEY`
- If `MUSIC_SOURCE=soundnet`, require `SOUNDNET_API_KEY`
- If `MUSIC_SOURCE=claude`, require `ANTHROPIC_API_KEY`

Log a clear startup message showing which APIs are configured.

---

### Task 10: Loading State Improvements

**Files:**
- Modify: `apps/web/app/generate/page.tsx`
- Modify: `apps/web/components/` (loading states)

Real APIs are slower than mocks. Add:
- Progress steps: "Parsing workout..." → "Finding tracks..." → "Building playlist..."
- Skeleton loading for playlist results
- Timeout message if generation takes >15 seconds

---

### Task 11: Custom Domain Setup

**Steps:**
1. Purchase domain (e.g., via Namecheap, Cloudflare)
2. Add to Vercel: `vercel domains add yourdomain.com`
3. Add to Fly.io: `fly certs create yourdomain.com` + DNS CNAME for `api.yourdomain.com`
4. Update `FRONTEND_URL` on Fly.io to include new domain
5. Update Spotify redirect URIs in dashboard
6. Update `NEXT_PUBLIC_APP_URL` on Vercel

---

### Task 12: Error Tracking (Sentry)

**Files:**
- Modify: `apps/api/requirements.txt` (add sentry-sdk)
- Modify: `apps/api/main.py` (init Sentry)
- Modify: `apps/web/` (add @sentry/nextjs)

Set up Sentry for both frontend and backend. Free tier covers hobby projects.

---

### Task 13: Rate Limiting & Cost Protection

**Files:**
- Modify: `apps/api/main.py` (tighten rate limits)
- Create: `apps/api/middleware/cost_guard.py`

Current rate limit is 10/minute per IP. For production:
- Consider tighter limits for unauthenticated users (3/minute)
- Add daily per-user budget tracking (Claude API costs ~$0.001/request with Haiku, but could add up)
- Add alerts if daily spend exceeds threshold

---

### Task 14: API Cost Monitoring

**Steps:**
1. Set up Anthropic usage alerts in the Anthropic Console
2. Set up Spotify API usage monitoring
3. Add a simple cost estimation to the health endpoint
4. Consider logging estimated cost per request
