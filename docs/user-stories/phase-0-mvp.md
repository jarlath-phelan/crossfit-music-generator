# Phase 0: MVP User Stories

## US-001: Generate Playlist from Workout Text

**As a** CrossFit coach  
**I want to** input workout text and get a Spotify playlist  
**So that** I can play appropriate music during class

### Acceptance Criteria

- [x] Accepts common CrossFit formats (AMRAP, RFT, EMOM, chipper, tabata)
- [x] Returns 3-7 tracks matching phases
- [x] Duration matches workout ±2 minutes
- [x] BPM matches intensity phases
- [ ] Spotify embed displays (MVP uses mock, future feature)

### Technical Notes

- Parses workout text using pattern matching (mock Anthropic API)
- Maps workout phases to intensity levels
- Queries track database by BPM and energy
- Composes playlist with smooth transitions

---

## US-002: View Parsed Workout Structure

**As a** coach  
**I want to** see how the system interpreted my workout  
**So that** I can verify it understood correctly

### Acceptance Criteria

- [x] Displays phases with duration/intensity
- [x] Shows BPM ranges per phase
- [x] Clear visual distinction between intensity levels
- [x] Shows total workout duration

### Technical Notes

- Color-coded intensity badges
- Phase cards with duration and BPM info
- Validates phase durations sum to total

---

## US-003: View Generated Playlist

**As a** coach  
**I want to** see the list of tracks with their details  
**So that** I can review the music selection

### Acceptance Criteria

- [x] Displays track name and artist
- [x] Shows BPM and energy for each track
- [x] Shows track duration
- [x] Displays total playlist duration
- [x] Clear track ordering (numbered list)

### Technical Notes

- Track list with metadata display
- Artist diversity validation
- BPM transition smoothness
- Total duration calculation

---

## US-004: Try Example Workouts

**As a** new user  
**I want to** try pre-filled example workouts  
**So that** I can quickly understand how the system works

### Acceptance Criteria

- [x] Provides 4+ example workout texts
- [x] One-click to load example
- [x] Examples cover different workout types
- [x] Examples show varied intensities

### Technical Notes

- Example buttons in UI
- Covers AMRAP, RFT, EMOM, and rounds for time
- Demonstrates different workout durations

---

## Technical Requirements

### Performance
- API response time < 3 seconds for typical workouts
- Frontend loads in < 2 seconds

### Error Handling
- Clear error messages for invalid workout text
- Graceful handling of API failures
- Toast notifications for user feedback

### Code Quality
- Full TypeScript type safety
- Pydantic validation on backend
- Structured logging for debugging
- Independent agent testing

### Mock Mode
- Works without API keys
- Mock Anthropic uses pattern matching
- Mock Spotify uses 50+ track database
- Feature flags to enable real APIs

