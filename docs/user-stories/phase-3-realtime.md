# Phase 3: Real-Time Biometric Integration

## US-301: Connect Wearable Device

**As an** attendee  
**I want to** connect my Apple Watch/Whoop/Fitbit  
**So that** the playlist can adapt to my heart rate

### Acceptance Criteria

- [ ] Connect Apple Watch (HealthKit)
- [ ] Connect Whoop device
- [ ] Connect Fitbit
- [ ] Real-time heart rate streaming
- [ ] Privacy controls (opt-in per class)

### Technical Notes

- Apple HealthKit integration
- Whoop API integration
- Fitbit Web API
- WebSocket for real-time data
- HIPAA considerations for health data

---

## US-302: Real-Time Playlist Adjustment

**As a** coach  
**I want to** the playlist to adjust based on class heart rates  
**So that** music matches actual intensity, not planned intensity

### Acceptance Criteria

- [ ] Monitor aggregate class heart rate
- [ ] Detect if class is under/over-exerting
- [ ] Automatically skip to higher/lower BPM track
- [ ] Coach receives adjustment notifications
- [ ] Manual override available
- [ ] Log all adjustments for review

### Technical Notes

- Real-time heart rate aggregation
- PlaylistAdjustmentAgent (new agent)
- WebSocket communication to frontend
- Spotify Playback SDK for control
- Thresholds for intensity detection

---

## US-303: Heart Rate Display on Gym Screen

**As a** coach  
**I want to** display attendee heart rates on gym screens  
**So that** I can monitor class intensity visually

### Acceptance Criteria

- [ ] Large screen display mode
- [ ] Shows all attendee names + HR
- [ ] Color-coded heart rate zones
- [ ] Aggregate class average
- [ ] Current track and upcoming tracks

### Technical Notes

- Separate display view route
- Real-time WebSocket updates
- Heart rate zone calculation
- Large, readable fonts
- Auto-refresh connection

---

## US-304: Post-Workout Biometric Analysis

**As an** attendee  
**I want to** see my heart rate matched to music  
**So that** I understand how music affected my performance

### Acceptance Criteria

- [ ] Heart rate graph over workout time
- [ ] Overlay track changes on graph
- [ ] Show target vs actual intensity
- [ ] Peak heart rate moments
- [ ] Export data to Apple Health

### Technical Notes

- Chart.js or recharts for visualization
- Store BiometricData time series
- Calculate correlations
- Export to standard health formats

---

## US-305: AI-Driven BPM Learning

**As a** coach  
**I want to** the system to learn optimal BPM per workout type  
**So that** playlists improve over time for my gym

### Acceptance Criteria

- [ ] System tracks HR vs BPM correlations
- [ ] Adjusts BPM ranges per workout type
- [ ] Learns gym-specific patterns
- [ ] Coach can review learning insights
- [ ] Reset learning if preferences change

### Technical Notes

- Machine learning model (scikit-learn or similar)
- Train on (workout_type, phase, bpm, avg_hr) data
- Update BPM_MAPPING per gym
- Model versioning and rollback
- A/B testing new ranges

---

## US-306: Competitive Leaderboards

**As an** attendee  
**I want to** see how my performance compares to others  
**So that** I stay motivated

### Acceptance Criteria

- [ ] Daily/weekly/monthly leaderboards
- [ ] Metrics: avg HR, time in zones, consistency
- [ ] Opt-in to public leaderboards
- [ ] Friends-only leaderboards
- [ ] Achievements and badges

### Technical Notes

- Leaderboard computation service
- Redis for caching rankings
- Privacy settings per user
- Gamification system
- Social features (follow friends)

---

## Architecture Changes (Phase 3)

### Real-Time System

```
┌─────────────┐         ┌──────────────┐
│   Wearable  │────────▶│  Data Ingest │
│   Devices   │         │   Service    │
└─────────────┘         └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   WebSocket  │
                        │    Server    │
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │ Frontend │    │ Playlist │    │ Display  │
       │  Clients │    │ Adjuster │    │  Screen  │
       └──────────┘    └──────────┘    └──────────┘
```

### Database Models (Phase 3)

```typescript
model BiometricData {
  id         String   @id @default(cuid())
  sessionId  String
  userId     String
  heartRate  Int
  timestamp  DateTime
  createdAt  DateTime @default(now())
}

model PlaylistAdjustment {
  id              String   @id @default(cuid())
  sessionId       String
  timestamp       DateTime
  reason          String
  avgHeartRate    Int
  targetIntensity String
  action          String   // "skip", "boost", "maintain"
  fromTrackId     String?
  toTrackId       String?
  createdAt       DateTime @default(now())
}

model PerformanceMetric {
  id               String   @id @default(cuid())
  sessionId        String
  userId           String
  avgHeartRate     Int
  maxHeartRate     Int
  timeInZone1      Int      // seconds
  timeInZone2      Int
  timeInZone3      Int
  timeInZone4      Int
  timeInZone5      Int
  caloriesBurned   Int?
  createdAt        DateTime @default(now())
}
```

