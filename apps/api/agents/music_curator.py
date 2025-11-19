"""
MusicCuratorAgent: Curates music tracks matching workout phase requirements
"""
import logging
from typing import Optional
from models.schemas import Phase, Track
from mocks.spotify_mock import MockSpotifyClient
from config import settings

logger = logging.getLogger(__name__)


class MusicCuratorAgent:
    """
    Agent responsible for finding and ranking tracks that match workout phases.
    
    Uses Spotify API (or mock implementation) to search tracks by BPM,
    energy level, and genre preferences.
    """
    
    # Default music preferences (Rob Miller, CrossFit Delaware Valley)
    DEFAULT_GENRE = "rock"
    DEFAULT_MIN_ENERGY = {
        "warm_up": 0.4,
        "low": 0.5,
        "moderate": 0.6,
        "high": 0.75,
        "very_high": 0.85,
        "cooldown": 0.3
    }
    
    def __init__(self):
        """Initialize the agent with appropriate Spotify client"""
        if settings.use_mock_spotify:
            logger.info("Using mock Spotify client")
            self.client = MockSpotifyClient()
        else:
            # Future: Initialize real Spotify client
            # import spotipy
            # from spotipy.oauth2 import SpotifyClientCredentials
            # auth_manager = SpotifyClientCredentials(
            #     client_id=settings.spotify_client_id,
            #     client_secret=settings.spotify_client_secret
            # )
            # self.client = spotipy.Spotify(auth_manager=auth_manager)
            raise NotImplementedError("Real Spotify API not yet implemented")
    
    def search_tracks(self, 
                     phase: Phase, 
                     limit: int = 20,
                     genre: Optional[str] = None) -> list[Track]:
        """
        Search for tracks matching phase requirements.
        
        Args:
            phase: Workout phase with BPM and intensity requirements
            limit: Maximum number of tracks to return
            genre: Music genre preference (defaults to rock)
            
        Returns:
            List of candidate tracks
        """
        bpm_min, bpm_max = phase.bpm_range
        min_energy = self.DEFAULT_MIN_ENERGY.get(phase.intensity, 0.5)
        
        logger.info(f"Searching tracks for {phase.name}: BPM {bpm_min}-{bpm_max}, energy >= {min_energy}")
        
        # Search tracks (mock client ignores genre parameter for now)
        tracks = self.client.search_tracks(
            bpm_min=bpm_min,
            bpm_max=bpm_max,
            min_energy=min_energy,
            max_energy=1.0,
            limit=limit
        )
        
        logger.info(f"Found {len(tracks)} candidate tracks for {phase.name}")
        return tracks
    
    def score_candidates(self, 
                        tracks: list[Track], 
                        phase: Phase,
                        used_artists: set[str]) -> list[tuple[Track, float]]:
        """
        Score and rank candidate tracks for a phase.
        
        Args:
            tracks: Candidate tracks
            phase: Target phase requirements
            used_artists: Set of artists already used (to avoid repeats)
            
        Returns:
            List of (track, score) tuples, sorted by score descending
        """
        bpm_min, bpm_max = phase.bpm_range
        target_bpm = (bpm_min + bpm_max) / 2
        target_energy = self.DEFAULT_MIN_ENERGY.get(phase.intensity, 0.5)
        
        scored_tracks = []
        
        for track in tracks:
            score = 0.0
            
            # BPM match (most important) - score 0-50 points
            bpm_diff = abs(track.bpm - target_bpm)
            bpm_range_size = bpm_max - bpm_min
            bpm_score = max(0, 50 - (bpm_diff / bpm_range_size * 50))
            score += bpm_score
            
            # Energy match - score 0-30 points
            energy_diff = abs(track.energy - target_energy)
            energy_score = max(0, 30 - (energy_diff * 30))
            score += energy_score
            
            # Artist diversity bonus - 20 points if not used
            if track.artist not in used_artists:
                score += 20
            else:
                score -= 10  # Penalty for repeating artist
            
            scored_tracks.append((track, score))
        
        # Sort by score descending
        scored_tracks.sort(key=lambda x: x[1], reverse=True)
        
        return scored_tracks
    
    def select_track_for_phase(self, 
                              phase: Phase, 
                              used_artists: set[str],
                              target_duration_ms: Optional[int] = None) -> Optional[Track]:
        """
        Select the best track for a workout phase.
        
        Args:
            phase: Workout phase requirements
            used_artists: Artists already used in playlist
            target_duration_ms: Preferred track duration (optional)
            
        Returns:
            Selected track or None if no suitable tracks found
        """
        # Search for candidates
        candidates = self.search_tracks(phase, limit=20)
        
        if not candidates:
            logger.warning(f"No tracks found for phase {phase.name}")
            return None
        
        # Score and rank candidates
        scored_candidates = self.score_candidates(candidates, phase, used_artists)
        
        # Select best track
        best_track, best_score = scored_candidates[0]
        logger.info(f"Selected '{best_track.name}' by {best_track.artist} "
                   f"(score: {best_score:.1f}) for {phase.name}")
        
        return best_track
    
    def learn(self, track: Track, feedback: dict) -> None:
        """
        Learn from user feedback (future implementation).
        
        Args:
            track: Track that received feedback
            feedback: User feedback data (rating, context, etc.)
        """
        # Future: Update track preferences based on feedback
        # This could adjust scoring weights, genre preferences, etc.
        logger.debug(f"Learning from feedback for track {track.id}: {feedback}")
        pass

