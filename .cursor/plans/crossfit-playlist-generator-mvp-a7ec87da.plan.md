<!-- a7ec87da-0dbc-4265-84b5-d7fb0d2ad93b 2f726691-4fd4-402c-9487-b7d15a8852b2 -->
# CrossFit Playlist Generator MVP

## Project Setup

### Monorepo Structure

- Initialize Turborepo monorepo with `apps/` and `packages/` directories
- Create `apps/web` (Next.js 15), `apps/api` (FastAPI), `packages/shared`, `packages/database`
- Add root `turbo.json`, `package.json`, and `README.md`

### Documentation

- Create `docs/user-stories/` with phase-0-mvp.md, phase-1-coach-profiles.md, phase-2-multi-user.md, phase-3-realtime.md
- Create `docs/architecture.md` with agent flow, tech stack, and data flow diagrams

## Backend (FastAPI)

### Core Structure

- Set up `apps/api/` with `main.py`, FastAPI app, CORS middleware
- Create `config.py` with Pydantic Settings for environment variables
- Add `requirements.txt` with all dependencies

### Pydantic Models (`models/schemas.py`)

- Define `Phase`, `WorkoutStructure`, `Track`, `Playlist` models
- Add commented future models: `CoachProfile`, `Attendee`, `ClassSession`, `TrackFeedback`

### Agent Architecture

**WorkoutParserAgent (`agents/workout_parser.py`)**

- Implement `plan()`, `execute()`, `validate()` methods
- Create mock Claude API implementation that parses common CrossFit formats
- Pattern matching for AMRAP, RFT, EMOM, chipper formats
- Return structured `WorkoutStructure` with phases, intensities, BPM ranges

**MusicCuratorAgent (`agents/music_curator.py`)**

- Implement `search_tracks()`, `score_candidates()`, `learn()` (placeholder)
- Create mock Spotify API with ~50 rock tracks database
- Filter by BPM range, energy level, duration
- Default genre: rock (Rob Miller preference)

**PlaylistComposerAgent (`agents/playlist_composer.py`)**

- Implement `compose()`, `validate_playlist()` methods
- Logic: smooth BPM transitions, no artist repeats, energy curve matching
- Ensure total duration matches workout ±2 minutes

### API Endpoint

- Create `POST /api/v1/generate` endpoint
- Accept `{"workout_text": str}`, return `{"workout": WorkoutStructure, "playlist": Playlist}`
- Add error handling, validation, structured logging

### Mock Implementations

- `mocks/anthropic_mock.py`: Pattern-based workout parser
- `mocks/spotify_mock.py`: In-memory track database with realistic metadata
- Environment flag to switch between mock/real APIs

## Frontend (Next.js 15)

### Setup

- Initialize Next.js 15 with App Router, TypeScript
- Configure Tailwind CSS v4
- Install and configure shadcn/ui components

### UI Components

- Create `app/page.tsx`: Home page with workout input form
- Text area with placeholder: "21-15-9 thrusters 95lbs and pull-ups"
- "Generate Playlist" button with loading states
- Display parsed workout phases (table/cards)
- Spotify playlist embed section
- Toast notifications for errors

### Server Actions

- Create `app/actions.ts`: Server Action calling FastAPI
- Type-safe fetch to `/api/v1/generate`
- Error handling with try-catch

### Future Placeholders

- Create `app/playlist/[id]/page.tsx`: Placeholder for future playlist view

## Shared Packages

### packages/shared

- Export TypeScript types matching Pydantic models
- `Phase`, `WorkoutStructure`, `Track`, `Playlist` interfaces

### packages/database

- Commented schema definitions for future Prisma/Drizzle setup
- Reference future models: `CoachProfile`, `Attendee`, etc.

## Configuration Files

- `.env.example`: Document all required environment variables
- Root `package.json`: Workspace configuration, scripts
- `turbo.json`: Pipeline for dev, build, lint tasks
- `tsconfig.json`: TypeScript configuration for monorepo

## Key Implementation Details

- BPM mapping: warm_up(100-120), low(120-130), moderate(130-145), high(145-160), very_high(160-175), cooldown(80-100)
- Mock track database: 50+ tracks across BPM ranges with realistic metadata
- Workout parser patterns: recognize "AMRAP", "RFT", "for time", "EMOM", chipper format
- Agent testing: Each agent independently testable with mocked dependencies
- Production-ready: Full type safety, error handling, logging

### To-dos

- [ ] Initialize Turborepo structure with apps/ and packages/ directories
- [ ] Create Next.js 15 app with TypeScript, Tailwind v4, and shadcn/ui
- [ ] Create FastAPI app with main.py, config, and requirements.txt
- [ ] Define all Pydantic models in schemas.py including future models as comments
- [ ] Build mock Anthropic and Spotify implementations with realistic data
- [ ] Create WorkoutParserAgent with pattern matching for CrossFit formats
- [ ] Create MusicCuratorAgent with BPM/energy filtering logic
- [ ] Create PlaylistComposerAgent with transition logic and validation
- [ ] Implement POST /api/v1/generate endpoint connecting all agents
- [ ] Define TypeScript types in packages/shared matching Pydantic models
- [ ] Create home page with workout form, phase display, and playlist embed
- [ ] Create server actions to call FastAPI endpoint with error handling
- [ ] Write user stories (all phases), architecture.md, and README.md