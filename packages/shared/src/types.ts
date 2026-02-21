/**
 * Shared TypeScript types matching backend Pydantic models
 */

export type IntensityLevel =
  | "warm_up"
  | "low"
  | "moderate"
  | "high"
  | "very_high"
  | "cooldown";

export interface Phase {
  name: string;
  duration_min: number;
  intensity: IntensityLevel;
  bpm_range: [number, number];
}

export interface WorkoutStructure {
  workout_name: string;
  total_duration_min: number;
  phases: Phase[];
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  energy: number;
  duration_ms: number;
  spotify_url?: string;
  spotify_uri?: string;
  album_art_url?: string;
}

export interface Playlist {
  name: string;
  tracks: Track[];
  spotify_url?: string;
}

export interface GeneratePlaylistRequest {
  workout_text?: string;
  workout_image_base64?: string;
  image_media_type?: string;
}

export interface GeneratePlaylistResponse {
  workout: WorkoutStructure;
  playlist: Playlist;
}

// Future Types (Phase 4+)
export interface CoachProfile {
  id: string;
  user_id: string;
  name: string;
  gym_name?: string;
  music_preferences: {
    genres: string[];
    exclude_artists: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface TrackFeedback {
  id: string;
  session_id: string;
  track_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}
