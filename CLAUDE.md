# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrossFit Playlist Generator - AI-driven music curation for CrossFit workouts. Parse workout text or photos, match music to intensity phases via pluggable music sources, and compose optimized playlists.

**Current Status**: Phase 5 - PWA with camera access. Installable as a Progressive Web App with live camera viewfinder, offline fallback, Spotify OAuth, database persistence.

## Monorepo Structure

```
crossfit-music-generator/
├── apps/
│   ├── web/                  # Next.js 16 frontend (React 19, Tailwind v4)
│   └── api/                  # FastAPI backend (Python 3.11+)
│       ├── agents/           # Three-agent pipeline
│       ├── clients/          # Real API clients (Anthropic, Spotify)
│       ├── music_sources/    # Pluggable music source backends
│       ├── mocks/            # Mock implementations for dev/testing
│       ├── models/           # Pydantic v2 schemas
│       └── tests/            # pytest test suite
├── packages/
│   ├── shared/               # Shared TypeScript types
│   └── database/             # Future schema definitions
├── .claude/                  # Claude Code config & hooks
├── .github/workflows/        # CI/CD
└── docs/                     # Architecture & user stories
```

## Development Commands

### Running the Application

```bash
# From project root - run both frontend and backend
pnpm dev

# Run only frontend
pnpm dev --filter=web

# Run only backend (requires Python 3.11 venv)
cd apps/api
source venv/bin/activate
python main.py
```

### Build & Lint

```bash
pnpm build            # Build all apps
pnpm lint             # Lint all code
pnpm clean            # Remove build artifacts
```

### Backend Testing

```bash
cd apps/api
source venv/bin/activate
pytest tests/ -v           # Run all tests
pytest tests/ -v --tb=short  # Short traceback
pytest tests/test_api.py   # Run specific test file
```

### Python Virtual Environment Setup

```bash
cd apps/api
python3.11 -m venv venv    # Must use Python 3.11 (3.14 incompatible with pydantic-core)
source venv/bin/activate
pip install -r requirements.txt
```

## Architecture

### Pipeline Overview

```
Input (text or photo) → Claude parses workout → Music source finds tracks by BPM → Scorer ranks → Composer builds playlist
```

### Agent-Based Backend

1. **WorkoutParserAgent** (`apps/api/agents/workout_parser.py`)
   - Parses workout text OR images into structured phases
   - Mock: Pattern matching. Real: Claude API with tool_use for structured output
   - Supports Claude Vision for whiteboard photos
   - Configurable model: `ANTHROPIC_MODEL` (default: `claude-haiku-4-5-20251001`)

2. **MusicCuratorAgent** (`apps/api/agents/music_curator.py`)
   - Uses pluggable `MusicSource` to search tracks by BPM range
   - Scores candidates: BPM match (50pts), energy (30pts), artist diversity (20pts)
   - Default genre: Rock

3. **PlaylistComposerAgent** (`apps/api/agents/playlist_composer.py`)
   - Composes final playlist with optimal track ordering
   - Max 30 BPM jump between consecutive tracks
   - Duration tolerance: ±2 minutes from workout duration

### Pluggable Music Sources (`apps/api/music_sources/`)

All implement `MusicSource` ABC with `search_by_bpm()` method:
- **`MockMusicSource`**: In-memory 50+ rock tracks (default, no API key)
- **`GetSongBPMMusicSource`**: GetSongBPM API (free, requires attribution)
- **`SoundNetMusicSource`**: RapidAPI Track Analysis (free tier: 1000 req/hr)
- **`ClaudeMusicSource`**: Claude song suggestions (unverified BPM, last resort)

Configured via `MUSIC_SOURCE` env var: `mock`, `getsongbpm`, `soundnet`, `claude`.

### Claude API Client (`apps/api/clients/anthropic_client.py`)

- Uses `tool_use` with forced tool choice for structured output
- Single tool: `parse_workout` → returns `WorkoutStructure`
- Supports both text and image (Vision API) input
- System prompt includes BPM mapping table and few-shot examples

### Key Constraint

Spotify Audio Features API is deprecated. BPM data comes from:
- Mock database (development)
- GetSongBPM / SoundNet (production)
- Claude suggestions (fallback, unverified)

### BPM to Intensity Mapping

```python
BPM_MAPPING = {
    "warm_up":    (100, 120),
    "low":        (120, 130),
    "moderate":   (130, 145),
    "high":       (145, 160),
    "very_high":  (160, 175),
    "cooldown":   (80, 100),
}
```

### Data Models

Pydantic v2 models in `apps/api/models/schemas.py`:
- `Phase`: Workout phase with intensity and BPM range
- `WorkoutStructure`: Complete parsed workout with phases
- `Track`: Music track with BPM, energy, optional `spotify_uri` and `album_art_url`
- `Playlist`: Ordered list of tracks
- `GeneratePlaylistRequest`: Accepts `workout_text` and/or `workout_image_base64`

TypeScript equivalents in `packages/shared/src/types.ts`.

## API Endpoints

### `POST /api/v1/generate`

Generate playlist from workout text or image.

**Request** (text):
```json
{"workout_text": "21-15-9 thrusters 95lbs and pull-ups"}
```

**Request** (image):
```json
{
  "workout_image_base64": "<base64>",
  "image_media_type": "image/jpeg",
  "workout_text": "optional context"
}
```

**Response**: `GeneratePlaylistResponse` with `workout` and `playlist`

### Other Endpoints

- `GET /`: API info, mock mode status, music source
- `GET /health`: Health check for all agents

## Development Workflow

### Branching

Branch names: `type-description` (e.g. `feat-photo-input`, `fix-bpm-parsing`)

### Commits

Use conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- Scopes: `api`, `web`, `shared`, `docs`, `infra`

### Adding a New Music Source

1. Create `apps/api/music_sources/your_source.py`
2. Implement `MusicSource` ABC (see `base.py`)
3. Add to factory in `apps/api/agents/music_curator.py:create_music_source()`
4. Add config option to `apps/api/config.py`
5. Write tests

## Environment Configuration

### Backend `.env` (apps/api/.env)

```bash
# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Spotify
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...

# Music Sources
GETSONGBPM_API_KEY=...
SOUNDNET_API_KEY=...
MUSIC_SOURCE=mock  # mock, getsongbpm, soundnet, claude

# Feature Flags
USE_MOCK_ANTHROPIC=true
USE_MOCK_SPOTIFY=true

# Server
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local` (apps/web/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## PWA

The app is a Progressive Web App using Next.js built-in support (no external PWA library):
- `apps/web/app/manifest.ts` — auto-linked web app manifest
- `apps/web/public/sw.js` — service worker with network-first strategy and offline fallback
- `apps/web/components/sw-register.tsx` — registers SW in production only
- `apps/web/public/offline.html` — branded offline fallback page
- PWA icons: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

Camera uses `navigator.mediaDevices.getUserMedia()` for live viewfinder with progressive enhancement fallback to `<input capture>`.

## Deployment

**Production**: https://crossfit-music-generator.vercel.app

Deployed on Vercel from the monorepo root with `rootDirectory: apps/web` and `sourceFilesOutsideRootDirectory: true` (configured via Vercel project settings).

```bash
vercel --prod              # Deploy to production
vercel                     # Preview deploy
vercel logs <url>          # Check build logs
```

Vercel config: `apps/web/vercel.json` (framework: nextjs). Environment variables (`BETTER_AUTH_SECRET`, `DATABASE_URL`, Spotify credentials) must be set in the Vercel dashboard.

## Future Phases

- **Phase 6**: Track feedback, playlist export, streaming progress

## Debugging

- **Backend logs**: Structured logs at INFO/ERROR levels
- **API testing**: Swagger UI at http://localhost:8000/docs
- **Mock data**: `apps/api/mocks/spotify_mock.py` (50 curated rock tracks)
- **Run tests**: `cd apps/api && source venv/bin/activate && pytest tests/ -v`
