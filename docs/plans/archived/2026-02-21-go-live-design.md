# Go Live with Real APIs — Design Document

**Date**: 2026-02-21
**Status**: Approved
**Approach**: Ship then iterate (must-haves first, fast follows in parallel)

## Decisions Made

- **Backend hosting**: Fly.io (~$3-5/mo always-on, fast cold starts)
- **Music sources**: All three (GetSongBPM, SoundNet, Claude) — toggled per-request via `X-Music-Source` header, default: `getsongbpm`
- **API keys needed**: Anthropic, Spotify, GetSongBPM, SoundNet (RapidAPI)
- **Custom domain**: Planned for later (fast follow)
- **Scope**: Potential product — needs reliability and good UX

## Must-Haves (Go Live)

### 1. Backend Deployment (Fly.io)

- `Dockerfile` in `apps/api/` — Python 3.11, uvicorn, production-ready
- `fly.toml` in `apps/api/` — shared-cpu, 256MB RAM, always-on (no auto-stop)
- Fly secrets for all API keys:
  - `ANTHROPIC_API_KEY`
  - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
  - `GETSONGBPM_API_KEY`
  - `SOUNDNET_API_KEY`
- Feature flags: `USE_MOCK_ANTHROPIC=false`, `USE_MOCK_SPOTIFY=false`
- Default music source: `MUSIC_SOURCE=getsongbpm`
- CORS: `FRONTEND_URL=https://crossfit-music-generator.vercel.app`
- Keep `render.yaml` as fallback (no active Render deployment)

### 2. Per-Request Music Source Toggle

- New `X-Music-Source` header accepted by the API
- Backend uses it to select music source per request, falls back to `MUSIC_SOURCE` env var
- Valid values: `getsongbpm`, `soundnet`, `claude`, `mock`
- Frontend passes header from server actions

### 3. Spotify OAuth (Production)

- Spotify Developer Dashboard: add production callback URL (`https://<app>.fly.dev/api/v1/spotify/callback`)
- Update `apps/api/config.py`: derive redirect URI from env var or request host (not hardcoded localhost)
- Vercel env vars: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (same credentials, used by Better Auth)
- Better Auth redirect URIs must match production

### 4. Auth & Database Verification

- Verify Supabase PostgreSQL reachable from Vercel production
- Run `drizzle-kit push` if migrations not yet applied
- Ensure Vercel env vars set: `BETTER_AUTH_SECRET`, `DATABASE_URL`

### 5. Frontend Updates

- Update `NEXT_PUBLIC_API_URL` in Vercel env vars → Fly.io URL
- Server actions send `X-Music-Source` header (default: `getsongbpm`)
- Basic error handling for real API failures (user-friendly error messages)

### 6. End-to-End Verification

1. Text input → Claude parses → BPM lookup → playlist generated
2. Photo input → Claude Vision → playlist generated
3. Spotify login → play tracks → export playlist
4. Save playlist → reload from library
5. Track feedback → affects next generation

## Fast Follows (post-live, can start in parallel)

1. **Music source selector in UI** — dropdown in settings/generate page
2. **Startup API key validation** — fail fast at boot if keys missing
3. **Loading state improvements** — better progress indicators for real API latency
4. **Custom domain** — buy domain, configure DNS for Vercel + Fly.io
5. **Error tracking** — Sentry or similar
6. **Rate limiting** — protect API from abuse (Claude API costs money)
7. **API cost monitoring** — track Anthropic spend

## Architecture (Post-Deploy)

```
User → Vercel (Next.js) → Fly.io (FastAPI)
                                ├── Anthropic Claude (workout parsing)
                                ├── GetSongBPM / SoundNet / Claude (BPM lookup)
                                └── Spotify API (track resolution, export)
       ↕
  Supabase PostgreSQL (auth, playlists, feedback)
```
