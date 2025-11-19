/**
 * Future Database Schema Definitions
 * 
 * Placeholder for Prisma/Drizzle schema when implementing multi-user features.
 * See docs/user-stories/phase-1-coach-profiles.md and beyond.
 */

// Phase 1: Coach Profiles
/*
model CoachProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  name            String
  gymName         String?
  musicPreferences Json     // { genres: string[], excludeArtists: string[] }
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
*/

// Phase 2: Multi-User
/*
model Attendee {
  id        String   @id @default(cuid())
  userId    String   @unique
  name      String
  createdAt DateTime @default(now())
}

model ClassSession {
  id              String   @id @default(cuid())
  coachId         String
  workoutText     String
  scheduledAt     DateTime
  attendeeIds     String[]
  playlistId      String?
  createdAt       DateTime @default(now())
}

model TrackFeedback {
  id         String   @id @default(cuid())
  sessionId  String
  trackId    String
  userId     String
  rating     Int      // 1-5
  createdAt  DateTime @default(now())
}
*/

// Phase 3: Realtime Biometric Integration
/*
model BiometricData {
  id         String   @id @default(cuid())
  sessionId  String
  userId     String
  heartRate  Int
  timestamp  DateTime
  createdAt  DateTime @default(now())
}
*/

export {};

