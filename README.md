# CrossFit Playlist Generator

Generate custom workout playlists from CrossFit workout descriptions using AI-driven music curation.

## Overview

This project generates Spotify-style playlists tailored to CrossFit workouts by:
1. **Parsing** workout text to understand intensity phases
2. **Curating** music tracks matching BPM and energy requirements
3. **Composing** optimized playlists with smooth transitions

**Current Status**: MVP (Phase 0) - Works out-of-the-box with mock APIs, no API keys required!

## Demo

![CrossFit Playlist Generator Demo](docs/images/demo-screenshot.png)

*Enter a workout description and instantly get a curated playlist matching your workout's intensity phases.*

## Features

### ✅ Phase 0: MVP (Current)

- Parse common CrossFit formats (AMRAP, RFT, EMOM, Tabata, Chipper)
- Generate playlists with 3-7 tracks matching workout intensity
- Display parsed workout structure with phases
- View track details (name, artist, BPM, energy)
- Works without API keys using intelligent mock implementations

### 🚧 Phase 1: Coach Profiles (Planned)

- Coach authentication and profiles
- Custom music preferences (genres, exclude artists)
- Save and reuse playlists
- Manual track override and "boost" feature
- Learning from coach feedback

### 🔮 Phase 2: Multi-User (Planned)

- Class scheduling with attendee invitations
- Aggregated music preferences
- Post-class feedback collection
- Spotify playlist creation and integration
- Class history and analytics

### 🌟 Phase 3: Real-Time Biometric (Planned)

- Wearable device integration (Apple Watch, Whoop, Fitbit)
- Real-time playlist adjustment based on heart rate
- Gym display screen with live metrics
- AI-driven BPM learning per gym
- Performance analytics and leaderboards

## Architecture

**Monorepo Structure**:
```
crossfit-playlist-generator/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   └── api/              # FastAPI backend
├── packages/
│   ├── shared/           # Shared TypeScript types
│   └── database/         # Future schema definitions
└── docs/                 # User stories & architecture
```

**Agent-Based Backend**:
- `WorkoutParserAgent`: Parses workout text into structured phases
- `MusicCuratorAgent`: Finds and ranks tracks by BPM/energy
- `PlaylistComposerAgent`: Orders tracks with smooth transitions

[Full architecture documentation →](docs/architecture.md)

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- (Optional) API keys for production use

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd crossfit-playlist-generator
   ```

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   pnpm install

   # Install backend dependencies
   cd apps/api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ../..
   ```

3. **Run the development servers**:
   ```bash
   # From project root, run both frontend and backend
   pnpm dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1: Backend
   cd apps/api
   source venv/bin/activate
   python main.py

   # Terminal 2: Frontend
   cd apps/web
   pnpm dev
   ```

4. **Open the app**:
   - Frontend: http://localhost:3000
   - API docs: http://localhost:8000/docs

### Try It Out

1. Enter a workout like: `21-15-9 thrusters 95lbs and pull-ups`
2. Click "Generate Playlist"
3. View the parsed workout structure and generated playlist!

## Mock vs Real APIs

### MVP Mode (Default)

The app works immediately without any API keys:

- **Mock Anthropic**: Pattern-matching parser for common workout formats
- **Mock Spotify**: In-memory database of 50+ curated rock tracks

### Production Mode (Optional)

To use real APIs, create `.env` files:

**apps/api/.env**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
USE_MOCK_ANTHROPIC=false
USE_MOCK_SPOTIFY=false
```

**apps/web/.env.local**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

### Frontend (`apps/web`)

```
apps/web/
├── app/
│   ├── page.tsx              # Home page with workout form
│   ├── actions.ts            # Server Actions for API calls
│   ├── layout.tsx            # Root layout
│   └── playlist/[id]/        # Future: Playlist detail page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── workout-form.tsx      # Workout input form
│   ├── workout-display.tsx   # Parsed workout view
│   └── playlist-display.tsx  # Track list view
└── lib/
    └── utils.ts              # Utility functions
```

### Backend (`apps/api`)

```
apps/api/
├── main.py                   # FastAPI app & endpoints
├── config.py                 # Settings management
├── agents/
│   ├── workout_parser.py     # Workout parsing agent
│   ├── music_curator.py      # Track search & scoring
│   └── playlist_composer.py  # Playlist composition
├── models/
│   └── schemas.py            # Pydantic models
└── mocks/
    ├── anthropic_mock.py     # Mock Claude API
    └── spotify_mock.py       # Mock Spotify API
```

## API Documentation

### Endpoint: `POST /api/v1/generate`

Generate a playlist from workout text.

**Request**:
```json
{
  "workout_text": "21-15-9 thrusters 95lbs and pull-ups"
}
```

**Response**:
```json
{
  "workout": {
    "workout_name": "21-15-9",
    "total_duration_min": 20,
    "phases": [
      {
        "name": "Warm-up",
        "duration_min": 5,
        "intensity": "warm_up",
        "bpm_range": [100, 120]
      },
      {
        "name": "Main WOD",
        "duration_min": 12,
        "intensity": "very_high",
        "bpm_range": [160, 175]
      },
      {
        "name": "Cooldown",
        "duration_min": 3,
        "intensity": "cooldown",
        "bpm_range": [80, 100]
      }
    ]
  },
  "playlist": {
    "name": "CrossFit: 21-15-9",
    "tracks": [
      {
        "id": "1",
        "name": "Use Somebody",
        "artist": "Kings of Leon",
        "bpm": 103,
        "energy": 0.52,
        "duration_ms": 230000
      }
      // ... more tracks
    ]
  }
}
```

Interactive API docs: http://localhost:8000/docs

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 |
| **UI Components** | shadcn/ui, Lucide Icons |
| **Monorepo** | Turborepo, pnpm workspaces |
| **AI (Future)** | Anthropic Claude API |
| **Music API (Future)** | Spotify Web API |
| **Database (Future)** | PostgreSQL, Prisma/Drizzle |
| **Deployment (Future)** | Vercel (frontend), Railway (backend) |

## Development

### Code Quality

- **TypeScript**: Strict mode enabled
- **Python**: Type hints with Pydantic
- **Linting**: ESLint (frontend), Black/Flake8 (backend)
- **Testing**: Jest + React Testing Library (frontend), Pytest (backend)

### Environment Variables

**Backend** (`apps/api/.env`):
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

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Scripts

```bash
# Development
pnpm dev              # Run all services
pnpm dev --filter=web # Run only frontend
pnpm dev --filter=api # Run only backend

# Build
pnpm build            # Build all apps

# Lint
pnpm lint             # Lint all code

# Clean
pnpm clean            # Remove build artifacts
```

## Roadmap

- [x] **Phase 0 (MVP)**: Basic playlist generation with mock APIs
- [ ] **Phase 1**: Coach profiles and music preferences
- [ ] **Phase 2**: Multi-user sessions and Spotify integration
- [ ] **Phase 3**: Real-time biometric integration
- [ ] **Phase 4**: Mobile apps (iOS/Android)

[Detailed user stories →](docs/user-stories/)

## Contributing

Contributions welcome! Please read our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

[MIT License](LICENSE)

## Acknowledgments

- Inspired by Rob Miller's need for dynamic workout playlists at CrossFit Delaware Valley
- Built with modern web technologies and AI-first design
- Music curation defaults to rock genre per coach preference

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](../../issues)
- 💬 [Discussions](../../discussions)

---

**Built with ❤️ for the CrossFit community**

