# Phase 2: Multi-User Sessions

## US-201: Schedule Class with Attendees

**As a** coach  
**I want to** schedule a class and invite attendees  
**So that** the playlist considers everyone's preferences

### Acceptance Criteria

- [ ] Create class session with date/time
- [ ] Invite attendees by email
- [ ] Attendees can RSVP
- [ ] Generate playlist based on aggregated preferences
- [ ] Weight coach preferences higher (e.g., 60/40 split)

### Technical Notes

- Add ClassSession model
- Email invitations
- Aggregate music preferences algorithm
- Weighted scoring in MusicCuratorAgent

---

## US-202: Attendee Music Preferences

**As an** attendee  
**I want to** set my music preferences  
**So that** class playlists include music I enjoy

### Acceptance Criteria

- [ ] Attendee signup/profile
- [ ] Set genre preferences (simpler than coach)
- [ ] Link Spotify account (optional)
- [ ] Auto-learn from Spotify listening history
- [ ] See how my preferences influenced playlists

### Technical Notes

- Add Attendee model with preferences
- Spotify OAuth integration
- Import top artists/genres from Spotify
- Privacy controls for data sharing

---

## US-203: Post-Class Feedback

**As an** attendee  
**I want to** rate tracks after class  
**So that** future playlists improve

### Acceptance Criteria

- [ ] Rate tracks 1-5 stars
- [ ] Quick thumbs up/down
- [ ] Optional comments on tracks
- [ ] See aggregate class ratings
- [ ] Submit feedback within 24 hours of class

### Technical Notes

- Add TrackFeedback model
- Post-class feedback form
- Push notification reminder
- Aggregate ratings display

---

## US-204: Spotify Playlist Integration

**As a** coach  
**I want to** automatically create Spotify playlists  
**So that** I can play them directly in class

### Acceptance Criteria

- [ ] Connect Spotify account (OAuth)
- [ ] Auto-create playlist on generation
- [ ] Playlist appears in coach's Spotify library
- [ ] Update playlist if tracks are modified
- [ ] Share playlist link with attendees

### Technical Notes

- Spotify OAuth flow
- Use Spotify API to create playlists
- Store spotify_playlist_id
- Sync modifications back to Spotify

---

## US-205: View Class History

**As a** coach  
**I want to** see past class sessions and their playlists  
**So that** I can track what worked well

### Acceptance Criteria

- [ ] List of past classes with dates
- [ ] View workout and playlist for each
- [ ] See attendee feedback aggregated
- [ ] Filter by date range
- [ ] Export class history

### Technical Notes

- Class history page
- Join ClassSession, Playlist, TrackFeedback
- Charts showing feedback trends
- CSV export option

---

## Database Models (Phase 2)

```typescript
model Attendee {
  id        String   @id @default(cuid())
  userId    String   @unique
  name      String
  email     String
  musicPreferences Json?
  spotifyId String?
  createdAt DateTime @default(now())
}

model ClassSession {
  id              String   @id @default(cuid())
  coachId         String
  workoutText     String
  scheduledAt     DateTime
  attendeeIds     String[]
  playlistId      String?
  spotifyPlaylistId String?
  createdAt       DateTime @default(now())
}

model TrackFeedback {
  id         String   @id @default(cuid())
  sessionId  String
  trackId    String
  userId     String
  rating     Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now())
}
```

