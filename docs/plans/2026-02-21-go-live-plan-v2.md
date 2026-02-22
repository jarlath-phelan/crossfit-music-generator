# Go Live Implementation Plan v2 (Post Expert Review)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy Crank (CrossFit Playlist Generator) with real APIs on Fly.io, incorporating critical fixes from 30-expert panel review.

**Architecture:** FastAPI on Fly.io → Next.js on Vercel → Supabase PostgreSQL. Pipeline: Claude parses workout → music source finds BPM tracks → scorer ranks → composer builds playlist → Spotify resolves URIs.

**Tech Stack:** Python 3.11, FastAPI, Next.js 16, React 19, Tailwind v4, Better Auth, Drizzle ORM, Supabase, Fly.io, Vercel.

**Key Decisions:**
- Pricing: Free first, monetize later
- Spotify risk: Add Apple Music support (fast follow)
- Product scope: Strip to Generate + Library only
- API security: HMAC signing before launch
- Genre UX: Tappable genre/vibe chips on generate page
- Named WODs: Tappable buttons expanding to full text
- SugarWOD: Research now, build soon
- Onboarding: 3-step guided walkthrough

---

## Execution Sequence

Work is grouped into 4 streams. Streams A and B can run in parallel. Stream C starts after A is deployed. Stream D is ongoing research.

### Stream A: Backend — Deploy & Harden (Fly.io)

Tasks 1→2→3→4→5 (sequential — each depends on the previous)

### Stream B: Frontend — UX Fixes & Polish (Vercel)

Tasks 6→7→8→9→10→11 (mostly independent, can be parallelized)

### Stream C: Integration & Verification

Tasks 12→13 (requires both A and B to be deployed)

### Stream D: Research (parallel with everything)

Task 14 (SugarWOD API research)

---

## Stream A: Backend — Deploy & Harden

### Task 1: Critical Backend Fixes (Expert Panel Quick Wins)

**Files:**
- Modify: `apps/api/main.py`
- Modify: `apps/api/models/schemas.py`
- Modify: `apps/api/agents/music_curator.py`

**Step 1: Change `async def generate_playlist` to `def generate_playlist`**

In `apps/api/main.py` line 187, change:
```python
async def generate_playlist(body: GeneratePlaylistRequest, request: Request):
```
to:
```python
def generate_playlist(body: GeneratePlaylistRequest, request: Request):
```

This makes FastAPI run the handler in a thread pool, preventing synchronous Claude/Spotify/BPM calls from blocking the event loop. 5-minute fix, critical for >1 concurrent user.

**Step 2: Add base64 payload size limit**

In `apps/api/models/schemas.py`, add `max_length` to `workout_image_base64`:
```python
workout_image_base64: Optional[str] = Field(None, max_length=14_000_000)  # ~10MB base64
```

**Step 3: Fix rate limiter to use X-Forwarded-For**

In `apps/api/main.py`, replace the limiter key function:
```python
def get_real_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

limiter = Limiter(key_func=get_real_client_ip)
```

**Step 4: Add stochastic selection to music curator**

In `apps/api/agents/music_curator.py`, replace the deterministic `scored_candidates[0]` pick with weighted random from top 5:
```python
import random

# Select from top candidates with weighted probability
top_n = scored_candidates[:5]
if not top_n:
    return None
weights = [score for _, score in top_n]
total = sum(weights)
if total <= 0:
    best_track = top_n[0][0]
else:
    weights = [w / total for w in weights]
    best_track = random.choices([t for t, _ in top_n], weights=weights, k=1)[0]
```

**Step 5: Add X-Music-Source to CORS headers and generate endpoint**

In `apps/api/main.py`, add `"X-Music-Source"` to `allow_headers`.
In the generate endpoint, read the header and pass it to the music curator.

**Step 6: Run tests**

Run: `cd apps/api && source venv/bin/activate && pytest tests/ -v`

**Step 7: Commit**

```bash
git commit -m "fix(api): critical backend fixes from expert panel review

- Change generate endpoint from async to sync (unblocks concurrency)
- Add base64 payload size limit (prevents DoS)
- Fix rate limiter to use X-Forwarded-For (correct per-user limiting)
- Add stochastic track selection (breaks deterministic playlists)
- Add X-Music-Source header support"
```

---

### Task 2: HMAC Signing for API Security

**Files:**
- Modify: `apps/api/main.py` (add HMAC verification middleware)
- Modify: `apps/api/config.py` (add `api_shared_secret` setting)
- Modify: `apps/web/app/actions.ts` (sign X-User-ID with HMAC)

**Step 1: Add shared secret to backend config**

In `apps/api/config.py`:
```python
api_shared_secret: Optional[str] = None  # HMAC shared secret with frontend
```

**Step 2: Add HMAC verification to generate endpoint**

In `apps/api/main.py`, before processing user headers:
```python
import hmac
import hashlib

# Verify X-User-ID signature if shared secret is configured
user_id = request.headers.get("X-User-ID")
if user_id and settings.api_shared_secret:
    signature = request.headers.get("X-User-Signature", "")
    expected = hmac.new(
        settings.api_shared_secret.encode(),
        user_id.encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        user_id = None  # Reject unsigned user ID
```

**Step 3: Sign user ID in frontend server action**

In `apps/web/app/actions.ts`, add HMAC signing:
```typescript
import { createHmac } from 'crypto'

const API_SHARED_SECRET = process.env.API_SHARED_SECRET

// In generatePlaylist(), after setting X-User-ID:
if (fetchHeaders['X-User-ID'] && API_SHARED_SECRET) {
  const signature = createHmac('sha256', API_SHARED_SECRET)
    .update(fetchHeaders['X-User-ID'])
    .digest('hex')
  fetchHeaders['X-User-Signature'] = signature
}
```

**Step 4: Set the shared secret**

Both Fly.io and Vercel need the same `API_SHARED_SECRET` env var.
Generate: `openssl rand -hex 32`

**Step 5: Commit**

```bash
git commit -m "feat(api,web): add HMAC signing for X-User-ID header security"
```

---

### Task 3: Fix Auth Route Error Handling

**Files:**
- Modify: `apps/web/app/api/auth/[...all]/route.ts`

**Step 1: Fix the catch-all to only swallow database errors**

Replace the blanket `catch {}` with specific error handling. Let OAuth validation errors propagate as proper error responses. Only catch database connection errors gracefully.

**Step 2: Commit**

```bash
git commit -m "fix(web): stop swallowing OAuth errors in auth catch-all route"
```

---

### Task 4: Dockerfile + fly.toml + Deploy

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `apps/api/fly.toml`

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

**Step 3: Create fly.toml with health check**

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

  [http_service.concurrency]
    type = "requests"
    soft_limit = 200
    hard_limit = 250

  [[http_service.checks]]
    grace_period = "30s"
    interval = "30s"
    method = "GET"
    path = "/health"
    timeout = "5s"

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

**Step 4: Test Docker build locally**

Run: `cd apps/api && docker build -t crossfit-api .`

**Step 5: Launch on Fly.io**

Run: `cd apps/api && fly launch --no-deploy`

**Step 6: Set secrets** (user provides real API keys)

```bash
fly secrets set \
  ANTHROPIC_API_KEY=... \
  SPOTIFY_CLIENT_ID=... \
  SPOTIFY_CLIENT_SECRET=... \
  GETSONGBPM_API_KEY=... \
  SOUNDNET_API_KEY=... \
  API_SHARED_SECRET=... \
  USE_MOCK_ANTHROPIC=false \
  USE_MOCK_SPOTIFY=false \
  MUSIC_SOURCE=getsongbpm \
  FRONTEND_URL=https://crossfit-music-generator.vercel.app \
  LOG_LEVEL=info
```

**Step 7: Deploy**

Run: `cd apps/api && fly deploy`

**Step 8: Verify**

Run: `curl https://crossfit-playlist-api.fly.dev/health`

**Step 9: Commit**

```bash
git commit -m "chore(api): add Dockerfile, fly.toml for Fly.io deployment"
```

---

### Task 5: Spotify OAuth Configuration

**Manual steps — no code changes required:**

1. Log into Spotify Developer Dashboard
2. Add redirect URI: `https://crossfit-music-generator.vercel.app/api/auth/callback/spotify`
3. Keep localhost URIs for local dev
4. Set Fly.io secret: `SPOTIFY_REDIRECT_URI=https://crossfit-playlist-api.fly.dev/api/v1/spotify/callback`

---

## Stream B: Frontend — UX Fixes & Polish

### Task 6: Strip to Generate + Library (Remove Empty Tabs)

**Files:**
- Modify: `apps/web/app/(tabs)/layout.tsx` (remove Music, Stats, Classes tabs)
- Modify: `apps/web/components/tab-bar.tsx` (only show Generate + Library)

Remove all tab entries except Generate and Library. Move settings/profile behind a gear icon in the header. Delete or hide the Music, Stats, and Classes page routes.

---

### Task 7: Fix Critical UX Bugs

**Files:**
- Modify: `apps/web/hooks/use-spotify-player.ts` (fix Play All)
- Modify: `apps/web/components/spotify-player.tsx` (fix seek slider accessibility)
- Modify: `apps/web/components/tab-bar.tsx` (fix ARIA roles)
- Modify: `apps/web/app/(tabs)/generate/page.tsx` (remove MOCK badge, add aria-live)

**Step 1: Fix Play All** — change `{ uris: [uri] }` to pass all track URIs.

**Step 2: Fix seek slider** — replace `div` with `<input type="range">` matching existing volume control pattern.

**Step 3: Fix tab bar ARIA** — remove `role="tablist"` and `role="tab"`, add `aria-current="page"`.

**Step 4: Remove MOCK badge** — delete or gate behind `NODE_ENV`.

**Step 5: Add aria-live** — wrap loading message in `aria-live="polite"` region.

**Step 6: Fix aria-describedby** — create the missing `#workout-hint` element with "Tip: Include durations for better results."

---

### Task 8: Genre/Vibe Chips on Generate Page

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx`
- Modify: `apps/web/app/actions.ts` (pass genre to API)

Add tappable genre chips above the workout input: Rock, Hip-Hop, EDM, Metal, Pop, Punk, Country, Indie. Selected genre is passed via the existing `X-User-Genre` header. Default to user's profile preference if set, otherwise "Rock".

---

### Task 9: Named WOD Buttons

**Files:**
- Modify: `apps/web/components/workout-form.tsx`

Replace the 4 simple example workouts with a larger set of named WOD buttons:

```
Fran → "21-15-9 thrusters (95/65 lbs) and pull-ups. ~5-10 min."
Murph → "1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run. ~35-60 min."
Grace → "30 clean and jerks for time (135/95 lbs). ~3-8 min."
DT → "5 rounds: 12 deadlifts, 9 hang cleans, 6 push jerks (155/105 lbs). ~8-15 min."
Cindy → "20 min AMRAP: 5 pull-ups, 10 push-ups, 15 squats."
```

Plus a "Full Class" example:
```
"60 min class: 10 min warm-up (3 rounds: 200m jog, 10 air squats, 10 PVC pass-throughs), 20 min strength (back squat 5x5), 25 min AMRAP (5 pull-ups, 10 push-ups, 15 squats), 5 min cooldown stretching"
```

Tapping a button populates the textarea with the expanded text.

---

### Task 10: Guided Onboarding (First Run)

**Files:**
- Create: `apps/web/components/onboarding.tsx`
- Modify: `apps/web/app/(tabs)/generate/page.tsx`

3-step intro on first visit (detected via localStorage):

1. **"Welcome to Crank"** — "Snap your whiteboard or paste your workout. Get a playlist that peaks when your workout peaks." + illustration
2. **"Try it now"** — auto-populate with a compelling example workout, pulsing Generate button
3. **"Make it yours"** — after first successful generation, prompt: "Sign in with Spotify to play, save, and export your playlists"

Sets `localStorage.crank_onboarding_complete = true` after completion. Skip button available.

---

### Task 11: Persist Last Playlist to localStorage

**Files:**
- Modify: `apps/web/app/(tabs)/generate/page.tsx`

Add `useEffect` that saves `result` to localStorage on change and restores on mount. Returning users see their previous playlist instead of empty state.

---

## Stream C: Integration & Verification

### Task 12: Set Vercel Environment Variables & Deploy

**Manual steps:**
1. Set in Vercel Dashboard: `NEXT_PUBLIC_API_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`, `API_SHARED_SECRET`
2. Run `npx drizzle-kit push` to verify migrations
3. Deploy: `vercel --prod` or push to main

---

### Task 13: End-to-End Verification

1. Text input → Claude parses → BPM lookup → playlist with real Spotify URIs
2. Photo input → Claude Vision → playlist
3. Spotify login → play tracks → export playlist
4. Save playlist → reload from library
5. Track feedback → affects next generation
6. Genre chips → playlist matches selected genre
7. Named WOD buttons → expand and generate correctly
8. Onboarding flow → shows on first visit, not on return visit

---

## Stream D: Research (Parallel)

### Task 14: SugarWOD API Research

**Deliverable:** Brief doc on SugarWOD/BTWB API availability, authentication, data format, and feasibility of auto-pulling daily WODs.

Research:
- Does SugarWOD have a public API?
- What data format are workouts in?
- Authentication model (OAuth, API key, scraping?)
- Rate limits and terms of service
- Feasibility estimate and rough implementation plan

Save to: `docs/plans/2026-02-21-sugarwod-research.md`

---

## Post-Launch Fast Follows (Priority Order)

1. **Apple Music support** — MusicKit JS integration as alternative player
2. **Phase-grouped track display** — group tracks by workout phase with section headers
3. **Per-track swap button** — regenerate one slot without regenerating entire playlist
4. **Shareable playlist links** — "Powered by Crank" with link in Spotify export
5. **Fix energy double-counting in scorer** — remove or replace BPM-derived energy
6. **Music source fallback chain** — getsongbpm → soundnet → mock
7. **Contextual sign-in prompts** — show locked buttons instead of hiding them
8. **CI/CD pipeline** — GitHub Action for automated Fly.io deploys
9. **Error tracking (Sentry)** — frontend + backend
10. **Community track quality database** — aggregate feedback across users
