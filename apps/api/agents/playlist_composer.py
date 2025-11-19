"""
PlaylistComposerAgent: Composes final playlists with optimal track ordering
"""
import logging
from typing import Optional
from models.schemas import WorkoutStructure, Phase, Track, Playlist
from agents.music_curator import MusicCuratorAgent

logger = logging.getLogger(__name__)


class PlaylistComposerAgent:
    """
    Agent responsible for composing the final playlist.
    
    Takes workout phases and curated tracks to create an optimally
    ordered playlist with smooth BPM transitions and no artist repeats.
    """
    
    def __init__(self, curator: MusicCuratorAgent):
        """
        Initialize the composer with a music curator.
        
        Args:
            curator: MusicCuratorAgent instance for track selection
        """
        self.curator = curator
    
    def compose(self, workout: WorkoutStructure) -> Playlist:
        """
        Compose a complete playlist for a workout.
        
        Args:
            workout: Parsed workout structure with phases
            
        Returns:
            Complete playlist with ordered tracks
        """
        logger.info(f"Composing playlist for '{workout.workout_name}'")
        
        tracks = []
        used_artists = set()
        
        for i, phase in enumerate(workout.phases):
            # Calculate target duration for this phase
            phase_duration_ms = phase.duration_min * 60 * 1000
            
            # Select tracks to fill the phase duration
            phase_tracks = self._select_tracks_for_phase(
                phase, 
                phase_duration_ms, 
                used_artists
            )
            
            tracks.extend(phase_tracks)
            
            # Update used artists
            for track in phase_tracks:
                used_artists.add(track.artist)
            
            logger.info(f"Phase {i+1} ({phase.name}): Added {len(phase_tracks)} track(s)")
        
        # Create playlist
        playlist = Playlist(
            name=f"CrossFit: {workout.workout_name}",
            tracks=tracks,
            spotify_url=None  # Future: Create actual Spotify playlist
        )
        
        logger.info(f"Composed playlist with {len(tracks)} tracks, "
                   f"total duration: {sum(t.duration_ms for t in tracks) / 60000:.1f} min")
        
        return playlist
    
    def _select_tracks_for_phase(self,
                                 phase: Phase,
                                 target_duration_ms: int,
                                 used_artists: set[str]) -> list[Track]:
        """
        Select one or more tracks to fill a phase duration.
        
        Args:
            phase: Workout phase
            target_duration_ms: Target duration in milliseconds
            used_artists: Set of artists already used
            
        Returns:
            List of tracks for this phase
        """
        phase_tracks = []
        accumulated_duration_ms = 0
        
        # Try to fill the phase duration (allow up to 90 seconds over)
        max_duration = target_duration_ms + 90000  # 1.5 min tolerance
        
        while accumulated_duration_ms < target_duration_ms:
            # Calculate remaining duration
            remaining_ms = max_duration - accumulated_duration_ms
            
            # Stop if we're very close to target
            if remaining_ms < 60000:  # Less than 1 minute remaining
                break
            
            # Select next track
            track = self.curator.select_track_for_phase(
                phase, 
                used_artists,
                target_duration_ms=remaining_ms
            )
            
            if not track:
                logger.warning(f"Could not find more tracks for phase {phase.name}")
                break
            
            # Check if adding this track would overshoot too much
            new_total = accumulated_duration_ms + track.duration_ms
            if new_total > max_duration and phase_tracks:
                # Already have at least one track, don't overshoot
                break
            
            phase_tracks.append(track)
            used_artists.add(track.artist)
            accumulated_duration_ms += track.duration_ms
        
        # Ensure we have at least one track per phase
        if not phase_tracks:
            track = self.curator.select_track_for_phase(phase, used_artists)
            if track:
                phase_tracks.append(track)
                used_artists.add(track.artist)
        
        return phase_tracks
    
    def validate_playlist(self, 
                         playlist: Playlist, 
                         workout: WorkoutStructure) -> tuple[bool, Optional[str]]:
        """
        Validate the composed playlist.
        
        Args:
            playlist: Generated playlist
            workout: Original workout structure
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check minimum requirements
        if not playlist.tracks:
            return False, "Playlist must have at least one track"
        
        # Check track count (should have 3-10 tracks for typical workouts)
        if len(playlist.tracks) > 15:
            logger.warning(f"Playlist has {len(playlist.tracks)} tracks, which is high")
        
        # Validate duration (should be within ±2 minutes of workout)
        playlist_duration_min = sum(t.duration_ms for t in playlist.tracks) / 60000
        duration_diff = abs(playlist_duration_min - workout.total_duration_min)
        
        if duration_diff > 2:
            return False, (f"Playlist duration ({playlist_duration_min:.1f} min) "
                          f"doesn't match workout ({workout.total_duration_min} min)")
        
        # Check for artist diversity
        artists = [t.artist for t in playlist.tracks]
        unique_artists = set(artists)
        
        if len(unique_artists) < len(artists) * 0.7:  # At least 70% unique
            logger.warning("Low artist diversity in playlist")
        
        # Validate BPM transitions (shouldn't jump more than 20 BPM between tracks)
        for i in range(len(playlist.tracks) - 1):
            current_bpm = playlist.tracks[i].bpm
            next_bpm = playlist.tracks[i + 1].bpm
            bpm_jump = abs(next_bpm - current_bpm)
            
            if bpm_jump > 30:
                logger.warning(f"Large BPM jump between tracks {i} and {i+1}: {bpm_jump} BPM")
        
        logger.info(f"Playlist validation passed: {len(playlist.tracks)} tracks, "
                   f"{playlist_duration_min:.1f} min duration")
        return True, None
    
    def compose_and_validate(self, workout: WorkoutStructure) -> Playlist:
        """
        Complete workflow: compose and validate playlist.
        
        Args:
            workout: Parsed workout structure
            
        Returns:
            Validated playlist
            
        Raises:
            ValueError: If validation fails
        """
        # Compose
        playlist = self.compose(workout)
        
        # Validate
        is_valid, error_msg = self.validate_playlist(playlist, workout)
        if not is_valid:
            raise ValueError(f"Invalid playlist: {error_msg}")
        
        return playlist

