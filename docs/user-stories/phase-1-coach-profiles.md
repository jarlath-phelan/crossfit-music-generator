# Phase 1: Coach Profiles

## US-101: Create Coach Profile

**As a** CrossFit coach  
**I want to** create a profile with my music preferences  
**So that** generated playlists match my taste

### Acceptance Criteria

- [ ] Sign up/login with email
- [ ] Set gym name
- [ ] Select preferred genres (multi-select)
- [ ] Exclude specific artists
- [ ] Set minimum energy level
- [ ] Toggle explicit content filtering

### Technical Notes

- Add authentication (NextAuth.js or similar)
- Store preferences in database
- Pass preferences to MusicCuratorAgent
- Update scoring algorithm based on preferences

---

## US-102: Save Generated Playlists

**As a** coach  
**I want to** save playlists I've generated  
**So that** I can reuse them for similar workouts

### Acceptance Criteria

- [ ] Save button after generation
- [ ] Name/rename saved playlists
- [ ] View list of saved playlists
- [ ] Delete saved playlists
- [ ] Quick regenerate from workout text

### Technical Notes

- Add Playlist model to database
- Store workout_text, workout_structure, and track_ids
- Playlist history page
- Search/filter saved playlists

---

## US-103: Manual Track Override

**As a** coach  
**I want to** manually replace tracks in a generated playlist  
**So that** I can fine-tune the music selection

### Acceptance Criteria

- [ ] Remove track button
- [ ] Search and add alternative tracks
- [ ] Drag-and-drop reordering
- [ ] Preview tracks before adding
- [ ] Save modifications

### Technical Notes

- Track search UI component
- Real Spotify API integration required
- Store manual modifications
- Feed back to learning system

---

## US-104: Boost Track Selection

**As a** coach  
**I want to** "boost" tracks I like  
**So that** they appear more often in future playlists

### Acceptance Criteria

- [ ] Thumbs up/down on tracks
- [ ] Boost button (higher weight in future)
- [ ] View my boosted tracks
- [ ] System learns from boost patterns

### Technical Notes

- Add TrackPreference model
- Adjust scoring in MusicCuratorAgent.score_candidates()
- Implement learn() method
- Weight adjustments based on feedback

---

## US-105: View Music Preference Stats

**As a** coach  
**I want to** see statistics about my music preferences  
**So that** I understand what the system has learned

### Acceptance Criteria

- [ ] Most used artists
- [ ] Genre distribution
- [ ] Average BPM by intensity
- [ ] Most boosted tracks
- [ ] Playlist history count

### Technical Notes

- Analytics page
- Aggregate TrackFeedback data
- Charts using recharts or similar
- Export data option

---

## Database Models (Phase 1)

```typescript
model CoachProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  name            String
  gymName         String?
  musicPreferences Json
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SavedPlaylist {
  id              String   @id @default(cuid())
  coachId         String
  name            String
  workoutText     String
  workoutStructure Json
  trackIds        String[]
  createdAt       DateTime @default(now())
}

model TrackPreference {
  id        String   @id @default(cuid())
  coachId   String
  trackId   String
  boost     Int      // -1, 0, or 1
  createdAt DateTime @default(now())
}
```

