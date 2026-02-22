# Crank — AI-Matched Music for CrossFit Workouts

[![Live App](https://img.shields.io/badge/app-live-success?style=for-the-badge&logo=vercel)](https://crossfit-music-generator.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

Drop your WOD. We'll bring the heat.

Crank parses any CrossFit workout — text or whiteboard photo — into intensity phases, then builds a BPM-matched Spotify playlist you can stream in-browser.

**Live at:** [crossfit-music-generator.vercel.app](https://crossfit-music-generator.vercel.app)

## How It Works

```
Workout text or photo → Claude parses phases → Music source finds tracks by BPM → Scorer ranks → Composer builds playlist → Stream via Spotify
```

1. **Enter a workout** — paste text, tap a named WOD (Fran, Murph, Grace, DT, Cindy), or snap a whiteboard photo
2. **Pick a genre** — Rock, Hip-Hop, EDM, Metal, Pop, Punk, Country, or Indie
3. **Get your playlist** — tracks matched to each workout phase by BPM and energy
4. **Stream it** — play directly in the browser via Spotify, or export to your Spotify library

## Features

- **AI workout parsing** — Claude understands AMRAP, RFT, EMOM, Tabata, Chipper, and custom formats
- **Photo input** — take a picture of a whiteboard and Claude Vision parses it
- **BPM-matched music** — tracks scored on BPM match (50pts), energy (30pts), artist diversity (20pts), feedback boost (15pts)
- **Spotify playback** — stream in-browser with play/pause, seek, skip, and volume controls (Premium required)
- **Spotify export** — save generated playlists to your Spotify account
- **8 genre options** — tappable genre chips on the generate page
- **Named WODs** — one-tap buttons for popular CrossFit workouts
- **Track feedback** — thumbs up/down to improve future recommendations
- **Playlist library** — save and revisit past playlists
- **Dark theme** — full dark mode with WCAG-accessible contrast
- **PWA** — installable as a mobile app with offline fallback
- **3-step onboarding** — walkthrough for first-time visitors

## Architecture

### Monorepo Structure

```
crossfit-music-generator/
├── apps/
│   ├── web/                  # Next.js 16 frontend (React 19, Tailwind v4)
│   │   ├── app/(tabs)/       # Tab-based layout (Generate, Library, Profile)
│   │   ├── components/       # UI components, player, onboarding
│   │   ├── hooks/            # Spotify player hook, auth hooks
│   │   └── lib/              # Auth config, utilities
│   └── api/                  # FastAPI backend (Python 3.11+)
│       ├── agents/           # 3-agent pipeline
│       ├── clients/          # Anthropic + Spotify API clients
│       ├── music_sources/    # Pluggable music backends
│       ├── models/           # Pydantic v2 schemas
│       └── tests/            # pytest suite
├── packages/
│   └── shared/               # Shared TypeScript types
└── docs/                     # Architecture, plans, research
```

### Three-Agent Pipeline

| Agent | Role | Mock Mode | Real Mode |
|-------|------|-----------|-----------|
| **WorkoutParser** | Parse workout into intensity phases with BPM ranges | Pattern matching | Claude API with tool_use (+ Vision for photos) |
| **MusicCurator** | Find and score tracks per phase | 50+ in-memory rock tracks | Pluggable: Claude, GetSongBPM, SoundNet |
| **PlaylistComposer** | Order tracks with smooth transitions | Same | Same (max 30 BPM jump, ±2 min duration tolerance) |

### BPM to Intensity Mapping

| Intensity | BPM Range | Example Phase |
|-----------|-----------|---------------|
| Warm-up | 100–120 | General warm-up |
| Low | 120–130 | Skill work |
| Moderate | 130–145 | Strength portion |
| High | 145–160 | Metcon |
| Very High | 160–175 | Sprint / max effort |
| Cooldown | 80–100 | Cool-down stretch |

### Music Sources

Configured via `MUSIC_SOURCE` env var:

| Source | Type | Notes |
|--------|------|-------|
| `mock` | In-memory | 50+ rock tracks, no API key needed (default) |
| `claude` | Claude API | AI-suggested tracks, unverified BPM (**current production**) |
| `getsongbpm` | GetSongBPM API | Real BPM data, free tier |
| `soundnet` | RapidAPI | Track analysis, free tier |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| **Backend** | FastAPI, Python 3.11+, Pydantic v2 |
| **AI** | Anthropic Claude API (Haiku for parsing, Vision for photos) |
| **Music** | Spotify Web Playback SDK, Spotify Web API |
| **Auth** | Better Auth with Spotify OAuth |
| **Database** | PostgreSQL (Supabase) via Drizzle ORM |
| **Analytics** | PostHog |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Deployment** | Vercel (frontend), Render (backend) |

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Python 3.11 (3.14 is incompatible with pydantic-core)

### Install & Run

```bash
# Clone
git clone https://github.com/jarlath-phelan/crossfit-music-generator.git
cd crossfit-music-generator

# Frontend dependencies
pnpm install

# Backend dependencies
cd apps/api
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# Run both (mock mode, no API keys needed)
pnpm dev
```

- **Frontend**: http://localhost:3000
- **API docs**: http://localhost:8000/docs

### Try It

1. Open http://localhost:3000
2. Tap "Fran" or type `21-15-9 thrusters 95lbs and pull-ups`
3. Pick a genre and hit Generate
4. View the parsed workout structure and generated playlist

## Configuration

### Mock Mode (Default)

Works out of the box — no API keys required. Uses pattern-matching parser and 50+ in-memory rock tracks.

### Production Mode

**Backend** (`apps/api/.env`):
```bash
# Claude API (workout parsing)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
USE_MOCK_ANTHROPIC=false

# Spotify (track resolution + playback)
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
USE_MOCK_SPOTIFY=false

# Music source
MUSIC_SOURCE=claude  # or: mock, getsongbpm, soundnet

# API security (HMAC signing between frontend and backend)
API_SHARED_SECRET=...

# Analytics (optional)
POSTHOG_API_KEY=...

# Server
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
API_SHARED_SECRET=...
```

## API

### `POST /api/v1/generate`

Generate a playlist from workout text or image.

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

**Response**: Parsed workout structure + ordered playlist with Spotify URIs, album art, and phase assignments.

**Rate limit**: 10 requests/minute per IP.

**Custom headers** (set by frontend for authenticated users):
`X-User-Genre`, `X-User-Boost-Artists`, `X-User-Hidden-Tracks`, `X-User-Min-Energy`

### Other Endpoints

- `GET /` — API info and configuration
- `GET /health` — Health check for all agents

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [crossfit-music-generator.vercel.app](https://crossfit-music-generator.vercel.app) |
| Backend | Render | [crossfit-playlist-api.onrender.com](https://crossfit-playlist-api.onrender.com) |
| Database | Supabase | PostgreSQL |

**Frontend** auto-deploys from `main` via Vercel. Configured with `rootDirectory: apps/web` and `sourceFilesOutsideRootDirectory: true`.

**Backend** runs on Render (free tier). Auto-deploys from `main` via `render.yaml` at repo root.

## Development

```bash
pnpm dev              # Run all services
pnpm build            # Build all apps
pnpm lint             # Lint all code
pnpm clean            # Remove build artifacts

# Backend tests
cd apps/api && source venv/bin/activate
pytest tests/ -v
```

### Branching & Commits

- Branches: `type-description` (e.g. `feat-photo-input`, `fix-bpm-parsing`)
- Commits: `type(scope): description` (e.g. `feat(web): add genre chips`)

## Roadmap

Research and design docs for upcoming features live in `docs/plans/`:

- **User Taste Profiles** (`2026-02-22-taste-profile-research.md`) — Import preferences from Spotify top artists, Last.fm history, and in-app feedback to personalize recommendations
- **ML Pipeline** (`2026-02-22-ml-pipeline-design.md`) — Enriched workout analysis with heart rate modeling and smart BPM-to-energy mapping
- **Deezer Music Source** (`2026-02-21-music-source-research.md`) — Native BPM search via free Deezer API (recommended next music source)

## Spotify Notes

- **Premium required** — the Web Playback SDK only works with Spotify Premium accounts
- **localhost banned** — use `http://127.0.0.1:3000` as the OAuth redirect URI for local dev
- Backend pipeline takes ~30-40s with real APIs — frontend has a 60s timeout configured

## License

[MIT](LICENSE)

---

Built for the CrossFit community.
