"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


# Intensity levels for workout phases
IntensityLevel = Literal["warm_up", "low", "moderate", "high", "very_high", "cooldown"]


class Phase(BaseModel):
    """Represents a single phase of a workout"""
    name: str = Field(..., description="Name of the workout phase")
    duration_min: int = Field(..., gt=0, description="Duration in minutes")
    intensity: IntensityLevel = Field(..., description="Intensity level of the phase")
    bpm_range: tuple[int, int] = Field(..., description="Target BPM range for music")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Warm-up",
                "duration_min": 5,
                "intensity": "warm_up",
                "bpm_range": [100, 120]
            }
        }


class WorkoutStructure(BaseModel):
    """Parsed structure of a CrossFit workout"""
    workout_name: str = Field(..., description="Name/type of the workout")
    total_duration_min: int = Field(..., gt=0, description="Total workout duration")
    phases: list[Phase] = Field(..., min_length=1, description="Workout phases")

    class Config:
        json_schema_extra = {
            "example": {
                "workout_name": "21-15-9 Thrusters and Pull-ups",
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
            }
        }


class Track(BaseModel):
    """Represents a music track with audio features"""
    id: str = Field(..., description="Track ID (source-specific or Spotify)")
    name: str = Field(..., description="Track name")
    artist: str = Field(..., description="Artist name")
    bpm: int = Field(..., gt=0, description="Beats per minute")
    energy: float = Field(..., ge=0, le=1, description="Energy level (0-1)")
    duration_ms: int = Field(..., gt=0, description="Track duration in milliseconds")
    spotify_url: Optional[str] = Field(None, description="Spotify URL for the track")
    spotify_uri: Optional[str] = Field(None, description="Spotify URI for playback")
    album_art_url: Optional[str] = Field(None, description="Album art image URL")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "3n3Ppam7vgaVa1iaRUc9Lp",
                "name": "Mr. Brightside",
                "artist": "The Killers",
                "bpm": 148,
                "energy": 0.89,
                "duration_ms": 223000,
                "spotify_url": "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp"
            }
        }


class Playlist(BaseModel):
    """Generated playlist matching workout structure"""
    name: str = Field(..., description="Playlist name")
    tracks: list[Track] = Field(..., min_length=1, description="Ordered list of tracks")
    spotify_url: Optional[str] = Field(None, description="Spotify playlist URL")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "CrossFit: 21-15-9 Thrusters and Pull-ups",
                "tracks": [],
                "spotify_url": None
            }
        }


class GeneratePlaylistRequest(BaseModel):
    """Request to generate a playlist from workout text or image"""
    workout_text: Optional[str] = Field(
        None,
        min_length=5,
        max_length=5000,
        description="CrossFit workout description (max 5000 characters)"
    )
    workout_image_base64: Optional[str] = Field(
        None,
        description="Base64-encoded image of workout (e.g. whiteboard photo)"
    )
    image_media_type: Optional[str] = Field(
        None,
        description="MIME type of the image (e.g. 'image/jpeg', 'image/png')"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "workout_text": "21-15-9 thrusters 95lbs and pull-ups"
            }
        }


class GeneratePlaylistResponse(BaseModel):
    """Response containing parsed workout and generated playlist"""
    workout: WorkoutStructure
    playlist: Playlist


# ============================================================================
# FUTURE MODELS (Phase 4+)
# Commented out for now - uncomment when implementing auth & persistence
# ============================================================================

# Phase 4: Coach Profiles with Music Preferences
"""
class MusicPreferences(BaseModel):
    genres: list[str] = Field(default_factory=lambda: ["rock"])
    exclude_artists: list[str] = Field(default_factory=list)
    min_energy: float = Field(default=0.5, ge=0, le=1)
    max_explicit: bool = Field(default=False)


class CoachProfile(BaseModel):
    id: str
    user_id: str
    name: str
    gym_name: Optional[str] = None
    music_preferences: MusicPreferences
    created_at: datetime
    updated_at: datetime
"""
