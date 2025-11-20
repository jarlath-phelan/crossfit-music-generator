# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrossFit Playlist Generator - AI-driven music curation for CrossFit workouts. Parse workout text, match music to intensity phases, and compose optimized playlists.

**Current Status**: MVP (Phase 0) - Works with mock APIs, no API keys required.

## Monorepo Structure

This is a Turborepo monorepo with pnpm workspaces:

```
crossfit-music-generator/
├── apps/
│   ├── web/          # Next.js 15 frontend (React 19, Tailwind v4)
│   └── api/          # FastAPI backend (Python 3.11+)
├── packages/
│   ├── shared/       # Shared TypeScript types
│   └── database/     # Future schema definitions
└── docs/             # Architecture & user stories
```

## Development Commands

### Running the Application

```bash
# From project root - run both frontend and backend
pnpm dev

# Run only frontend
pnpm dev --filter=web

# Run only backend (requires Python venv)
cd apps/api
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

### Build & Lint

```bash
pnpm build            # Build all apps
pnpm lint             # Lint all code
pnpm clean            # Remove build artifacts
```

### Backend-Specific Commands

```bash
# From apps/api directory
python main.py                           # Run development server
uvicorn main:app --reload --port 8000   # Alternative with uvicorn directly
pip install -r requirements.txt         # Install dependencies

# Access API documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### Python Virtual Environment Setup

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Architecture

### Agent-Based Backend

The backend uses a three-agent pipeline:

1. **WorkoutParserAgent** (`apps/api/agents/workout_parser.py`)
   - Parses workout text into structured phases
   - Identifies format (AMRAP, RFT, EMOM, Tabata, Chipper)
   - Maps phases to intensity levels and BPM ranges
   - Current: Pattern matching. Future: Claude API with structured output

2. **MusicCuratorAgent** (`apps/api/agents/music_curator.py`)
   - Searches tracks by BPM range and energy level
   - Scores candidates based on BPM match, energy, artist diversity
   - Default genre: Rock (per coach preference)
   - Current: In-memory mock database. Future: Spotify API

3. **PlaylistComposerAgent** (`apps/api/agents/playlist_composer.py`)
   - Composes final playlist with optimal track ordering
   - Ensures smooth BPM transitions (max 30 BPM jump)
   - Prevents artist repeats
   - Validates total duration matches workout (±2 minutes)

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

All models are defined using Pydantic v2 in `apps/api/models/schemas.py`:
- `Phase`: Single workout phase with intensity and BPM range
- `WorkoutStructure`: Complete parsed workout with phases
- `Track`: Music track with metadata (name, artist, BPM, energy)
- `Playlist`: Ordered list of tracks
- Future models (commented): `CoachProfile`, `Attendee`, `ClassSession`, `TrackFeedback`

TypeScript equivalents are in `packages/shared/src/types.ts`.

### Mock vs Real APIs

**Mock Mode (Default)**:
- `USE_MOCK_ANTHROPIC=true`: Pattern-matching parser
- `USE_MOCK_SPOTIFY=true`: In-memory database of 50+ rock tracks
- Located in `apps/api/mocks/`

**Production Mode**:
Set environment variables in `apps/api/.env`:
```bash
USE_MOCK_ANTHROPIC=false
USE_MOCK_SPOTIFY=false
ANTHROPIC_API_KEY=sk-ant-...
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

## Frontend Architecture

### Next.js 15 App Router

- **Page**: `apps/web/app/page.tsx` - Home page with workout form
- **Server Actions**: `apps/web/app/actions.ts` - Type-safe API calls to backend
- **Components**: `apps/web/components/` - UI components (shadcn/ui based)
  - `workout-form.tsx`: Workout input form
  - `workout-display.tsx`: Parsed workout phases view
  - `playlist-display.tsx`: Track list with metadata

### Styling

- Tailwind CSS v4 (latest)
- shadcn/ui components in `components/ui/`
- Lucide React icons

## API Endpoints

### `POST /api/v1/generate`

Generate playlist from workout text.

**Request**:
```json
{
  "workout_text": "21-15-9 thrusters 95lbs and pull-ups"
}
```

**Response**: `GeneratePlaylistResponse` with `workout` (WorkoutStructure) and `playlist` (Playlist)

### Other Endpoints

- `GET /`: API info and mock mode status
- `GET /health`: Health check for all agents

## Key Implementation Patterns

### Agent Initialization

Agents are initialized once at application startup using FastAPI's `lifespan` context manager (apps/api/main.py:29-42). They are stored as global instances and reused across requests.

### Error Handling

- **Backend**: Pydantic validation errors → 400, agent errors → 500
- **Frontend**: Server Actions catch errors and display toast notifications
- All errors are logged with structured logging

### Type Safety

- **Backend**: Python type hints with Pydantic v2 strict mode
- **Frontend**: TypeScript strict mode enabled
- **Shared**: Types defined in `packages/shared` match Pydantic models exactly

## Testing Strategy (Future)

- **Unit tests**: Test each agent independently with mocked dependencies (pytest)
- **Integration tests**: Test full pipeline via FastAPI TestClient
- **E2E tests**: Playwright tests for frontend user flows
- **Code quality**: ESLint (frontend), Black/Flake8 (backend)

## Common Development Patterns

### Adding New Workout Format

1. Update pattern matching in `WorkoutParserAgent.execute()`
2. Add intensity mapping logic
3. Test with sample workout text

### Adding New Track Source

1. Update `MusicCuratorAgent.search_tracks()`
2. Ensure BPM and energy metadata is available
3. Update scoring algorithm if needed

### Modifying BPM Ranges

Update `BPM_MAPPING` in both:
- `apps/api/agents/music_curator.py`
- Documentation in `docs/architecture.md`

## Future Phases

- **Phase 1**: Coach profiles, music preferences, playlist saving
- **Phase 2**: Multi-user classes, Spotify integration, feedback learning
- **Phase 3**: Real-time biometric integration (wearables, heart rate)

See `docs/user-stories/` for detailed specifications.

## Environment Configuration

### Backend `.env` (apps/api/.env)

```bash
# API Keys (optional for MVP)
ANTHROPIC_API_KEY=sk-ant-...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...

# Feature Flags
USE_MOCK_ANTHROPIC=true
USE_MOCK_SPOTIFY=true

# Server Config
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

### Frontend `.env.local` (apps/web/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Debugging

- **Backend logs**: Structured logs at INFO/ERROR levels with context
- **Frontend**: React DevTools, Next.js development overlay
- **API testing**: Use Swagger UI at http://localhost:8000/docs
- **Mock data**: Check `apps/api/mocks/spotify_mock.py` for available tracks
