# Architecture Documentation

## System Overview

The CrossFit Playlist Generator uses an agent-based architecture to parse workouts and curate music. The system is designed to scale from MVP (single workout text → playlist) to a multi-user, real-time biometric-driven platform.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: React hooks + Server Actions
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Validation**: Pydantic v2
- **AI Integration**: Anthropic Claude API (future)
- **Music API**: Spotify Web API (future)
- **Server**: Uvicorn

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Deployment**: Vercel (frontend), Railway (backend)
- **Database**: PostgreSQL (future phases)

## Agent Architecture

### Three-Agent Pipeline

```
┌──────────────────┐
│  Workout Text    │
│  "21-15-9..."    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│  WorkoutParserAgent        │
│  - Understands formats     │
│  - Extracts phases         │
│  - Maps to BPM ranges      │
└────────┬───────────────────┘
         │
         ▼ WorkoutStructure
┌────────────────────────────┐
│  MusicCuratorAgent         │
│  - Searches tracks by BPM  │
│  - Scores candidates       │
│  - Ensures variety         │
└────────┬───────────────────┘
         │
         ▼ Track Pool
┌────────────────────────────┐
│  PlaylistComposerAgent     │
│  - Orders tracks optimally │
│  - Validates transitions   │
│  - Matches duration        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────┐
│  Final Playlist    │
│  (JSON response)   │
└────────────────────┘
```

### Agent Details

#### WorkoutParserAgent

**Purpose**: Parse natural language workout descriptions into structured phases.

**Methods**:
- `plan(workout_text)`: Determine parsing strategy
- `execute(workout_text)`: Perform the parsing
- `validate(workout)`: Ensure output is valid

**Current Implementation**: Pattern matching for common CrossFit formats (AMRAP, RFT, EMOM, Tabata, Chipper).

**Future**: Use Claude API with structured output for complex workouts.

**Input**: String (e.g., "21-15-9 thrusters 95lbs and pull-ups")

**Output**: 
```python
WorkoutStructure(
  workout_name="21-15-9",
  total_duration_min=20,
  phases=[
    Phase(name="Warm-up", duration_min=5, intensity="warm_up", bpm_range=(100, 120)),
    Phase(name="Main WOD", duration_min=12, intensity="very_high", bpm_range=(160, 175)),
    Phase(name="Cooldown", duration_min=3, intensity="cooldown", bpm_range=(80, 100))
  ]
)
```

#### MusicCuratorAgent

**Purpose**: Find and rank music tracks matching workout phase requirements.

**Methods**:
- `search_tracks(phase)`: Query music database by BPM and energy
- `score_candidates(tracks, phase)`: Rank tracks for suitability
- `select_track_for_phase(phase, used_artists)`: Choose best track
- `learn(track, feedback)`: Update preferences from feedback (future)

**Scoring Algorithm**:
- BPM match: 0-50 points (most important)
- Energy match: 0-30 points
- Artist diversity: +20 points for new artist, -10 for repeat

**Current Implementation**: Queries in-memory mock database of 50+ rock tracks.

**Future**: Query Spotify API with complex filters, learn from user feedback.

#### PlaylistComposerAgent

**Purpose**: Compose the final playlist with optimal track ordering.

**Methods**:
- `compose(workout)`: Generate complete playlist
- `validate_playlist(playlist, workout)`: Ensure quality
- `_select_tracks_for_phase(phase, duration, used_artists)`: Fill phase duration

**Composition Logic**:
1. Iterate through workout phases
2. For each phase, select tracks to fill duration (±90 seconds tolerance)
3. Ensure no artist repeats within playlist
4. Validate smooth BPM transitions (max 30 BPM jump)
5. Verify total duration matches workout (±2 minutes)

**Quality Checks**:
- At least 70% unique artists
- Duration within tolerance
- BPM transitions not too jarring

## Data Flow

### MVP Flow (Phase 0)

```
┌─────────┐                    ┌─────────┐
│ Browser │◄───────────────────┤ Next.js │
│         │  1. Render Form    │   App   │
└────┬────┘                    └─────────┘
     │
     │ 2. Submit workout text
     │
     ▼
┌─────────────┐
│ Server      │
│ Action      │
└──────┬──────┘
       │
       │ 3. POST /api/v1/generate
       │
       ▼
┌─────────────────────────────┐
│ FastAPI                     │
│ ┌─────────────────────────┐ │
│ │ WorkoutParserAgent      │ │
│ └────────┬────────────────┘ │
│          │                   │
│          ▼                   │
│ ┌─────────────────────────┐ │
│ │ MusicCuratorAgent       │ │
│ └────────┬────────────────┘ │
│          │                   │
│          ▼                   │
│ ┌─────────────────────────┐ │
│ │ PlaylistComposerAgent   │ │
│ └────────┬────────────────┘ │
│          │                   │
└──────────┼───────────────────┘
           │
           │ 4. Return JSON
           │
           ▼
┌─────────────┐
│ Browser     │
│ Display:    │
│ - Workout   │
│ - Playlist  │
└─────────────┘
```

### Future Flow (Phase 2+)

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│  Coach  │         │ Attendee │         │ Attendee│
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ Create class      │                     │
     │─────────────────▶ │                     │
     │                   │ RSVP                │
     │◀──────────────────│                     │
     │                   │                     │
     │                   │◀────────────────────│ RSVP
     │◀──────────────────────────────────────────────
     │                                         │
     │ Generate playlist with aggregated prefs │
     │─────────────────────────────────────────▶
     │                                         │
     │◀─────────── Playlist created ──────────│
     │                                         │
     │         Publish to Spotify              │
     │─────────────────────────────────────────▶
     │                                         │
     │         Class happens                   │
     │         (music plays)                   │
     │                                         │
     │◀────────── Post-class feedback ─────────│
     │                                         │
     │         Learning update                 │
     └─────────────────────────────────────────▶
```

## BPM to Intensity Mapping

```python
BPM_MAPPING = {
    "warm_up":    (100, 120),  # Light cardio, mobility
    "low":        (120, 130),  # Skill work, light lifting
    "moderate":   (130, 145),  # Moderate MetCon
    "high":       (145, 160),  # Heavy MetCon, challenging pace
    "very_high":  (160, 175),  # Max effort, sprint work
    "cooldown":   (80, 100),   # Recovery, stretching
}
```

## Mock Implementations

### Why Mocks?

The MVP is designed to work immediately without requiring:
- Anthropic API key ($$$)
- Spotify API credentials
- Database setup
- Authentication system

### MockAnthropicClient

**Location**: `apps/api/mocks/anthropic_mock.py`

**Approach**: Pattern matching with regex

**Supported Formats**:
- AMRAP: "AMRAP 20 minutes: ..."
- RFT: "5 rounds for time: ..." or "21-15-9 ..."
- EMOM: "EMOM 12 minutes: ..."
- Tabata: "Tabata: ..."
- Chipper: Fallback for long exercise lists

**Example**:
```python
"21-15-9 thrusters and pull-ups"
→ Detects: RFT with descending reps
→ Estimates: 12 min main work + 5 min warm-up + 3 min cooldown
→ Returns: 3 phases (warm_up, very_high, cooldown)
```

### MockSpotifyClient

**Location**: `apps/api/mocks/spotify_mock.py`

**Approach**: In-memory database of 50+ curated rock tracks

**Database Includes**:
- Track metadata (name, artist, BPM, energy, duration)
- Covers full BPM range (80-175)
- Genre: Rock (per Rob Miller's preference)
- Realistic Spotify track IDs

**Search Algorithm**:
```python
def search_tracks(bpm_min, bpm_max, min_energy, limit):
    1. Filter tracks in BPM range
    2. Filter tracks above min_energy
    3. Sort by distance from BPM midpoint
    4. Return top N results
```

## Switching to Real APIs

### Anthropic Claude

1. Set `USE_MOCK_ANTHROPIC=false` in `.env`
2. Add `ANTHROPIC_API_KEY=sk-ant-...` 
3. Update `WorkoutParserAgent.__init__()`:
   ```python
   from anthropic import Anthropic
   self.client = Anthropic(api_key=settings.anthropic_api_key)
   ```
4. Implement structured output API call in `execute()`

### Spotify

1. Set `USE_MOCK_SPOTIFY=false` in `.env`
2. Add Spotify credentials to `.env`
3. Update `MusicCuratorAgent.__init__()`:
   ```python
   import spotipy
   from spotipy.oauth2 import SpotifyClientCredentials
   auth_manager = SpotifyClientCredentials(
       client_id=settings.spotify_client_id,
       client_secret=settings.spotify_client_secret
   )
   self.client = spotipy.Spotify(auth_manager=auth_manager)
   ```
4. Update `search_tracks()` to use Spotify search API with audio features

## Error Handling

### Backend

- **Validation errors**: Pydantic raises 400 with detailed field errors
- **Agent errors**: Wrapped in try/catch, return 500 with error message
- **Logging**: Structured logs at INFO/ERROR levels with context

### Frontend

- **Network errors**: Caught in Server Action, display toast
- **Validation errors**: Show inline form errors
- **Loading states**: Spinner during generation
- **Empty states**: Guide users with examples

## Testing Strategy

### Unit Tests (Future)

```python
# Test agent independently
def test_workout_parser_amrap():
    agent = WorkoutParserAgent()
    workout = agent.execute("AMRAP 20 minutes: 5 pull-ups, 10 push-ups")
    assert workout.workout_name == "20 Minute AMRAP"
    assert workout.total_duration_min == 28  # includes warm-up/cooldown

# Test with mocked dependencies
def test_playlist_composer():
    mock_curator = Mock(spec=MusicCuratorAgent)
    mock_curator.select_track_for_phase.return_value = mock_track
    
    composer = PlaylistComposerAgent(curator=mock_curator)
    playlist = composer.compose(mock_workout)
    
    assert len(playlist.tracks) >= 3
    assert playlist.tracks[0].bpm in range(100, 120)  # warm-up
```

### Integration Tests (Future)

```python
def test_full_pipeline():
    response = client.post("/api/v1/generate", json={
        "workout_text": "21-15-9 thrusters and pull-ups"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "workout" in data
    assert "playlist" in data
    assert len(data["playlist"]["tracks"]) >= 3
```

### E2E Tests (Future)

```typescript
// Playwright test
test('generate playlist from workout', async ({ page }) => {
  await page.goto('/')
  await page.fill('textarea', '21-15-9 thrusters and pull-ups')
  await page.click('button:has-text("Generate Playlist")')
  
  await expect(page.locator('text=21-15-9')).toBeVisible()
  await expect(page.locator('text=Main WOD')).toBeVisible()
  await expect(page.locator('[data-testid="track-list"]')).toBeVisible()
})
```

## Performance Considerations

### Current (MVP)

- No database queries
- In-memory mock APIs
- Single-threaded FastAPI
- Expected response time: < 1 second

### Phase 1+

- Database queries optimized with indexes
- Caching for frequently accessed data (Redis)
- Connection pooling for database
- Rate limiting for external APIs
- Response time target: < 3 seconds

### Phase 3 (Real-Time)

- WebSocket server for real-time data
- Message queue (Redis Pub/Sub or RabbitMQ)
- Horizontal scaling of services
- CDN for static assets
- Real-time target: < 100ms latency for HR updates

## Security

### Current (MVP)

- CORS enabled for localhost
- Input validation via Pydantic
- No authentication required

### Future Phases

- JWT-based authentication
- Role-based access control (coach vs attendee)
- Rate limiting per user
- API key rotation
- HTTPS only
- Secure storage of health data (encryption at rest)
- HIPAA compliance for biometric data

## Monitoring & Observability (Future)

- **Logging**: Structured JSON logs to Datadog/CloudWatch
- **Metrics**: Prometheus + Grafana dashboards
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerts**: PagerDuty for critical failures
- **Analytics**: Mixpanel/Amplitude for user behavior

