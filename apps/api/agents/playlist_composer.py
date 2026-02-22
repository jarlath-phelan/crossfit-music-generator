"""
PlaylistComposerAgent: Composes final playlists with optimal track ordering
"""
import logging
import time as _time
from typing import Optional
from models.schemas import WorkoutStructure, Phase, Track, Playlist
from agents.music_curator import MusicCuratorAgent

logger = logging.getLogger(__name__)

# Constants for playlist composition
MS_PER_MINUTE = 60000  # Milliseconds in one minute
PHASE_DURATION_TOLERANCE_MS = 90000  # Allow up to 90 seconds over target (1.5 min)
MIN_REMAINING_DURATION_MS = 60000  # Stop adding tracks if less than 60s remaining
MAX_DURATION_DIFF_MIN = 5.0  # Maximum difference between playlist and workout duration (minutes)
MIN_ARTIST_DIVERSITY = 0.7  # Require at least 70% unique artists
MAX_RECOMMENDED_TRACKS = 15  # Warn if playlist exceeds this many tracks
MAX_BPM_JUMP = 30  # Maximum BPM change between consecutive tracks


class PlaylistComposerAgent:
    """
    Agent responsible for composing the final playlist.

    Takes workout phases and curated tracks to create an optimally
    ordered playlist with smooth BPM transitions and no artist repeats.
    """

    def __init__(self, curator: MusicCuratorAgent):
        self.curator = curator

    def compose(
        self,
        workout: WorkoutStructure,
        genre: Optional[str] = None,
        min_energy: Optional[float] = None,
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
        hidden_tracks: Optional[set[str]] = None,
    ) -> Playlist:
        """
        Compose a complete playlist for a workout.

        Uses batch prefetching to get all track candidates in a single API call
        (when the music source supports it), then scores and selects locally.
        """
        logger.info(f"Composing playlist for '{workout.workout_name}'")

        tracks = []
        used_artists = set(exclude_artists or set())

        # PREFETCH: Get all track candidates in one batch (single API call for Claude source)
        prefetch_start = _time.time()
        track_pools = self.curator.batch_search_tracks(
            workout.phases,
            genre=genre,
            min_energy=min_energy,
            exclude_artists=exclude_artists,
            boost_artists=boost_artists,
        )
        prefetch_elapsed = _time.time() - prefetch_start
        total_candidates = sum(len(v) for v in track_pools.values())
        logger.info(f"Track prefetch: {total_candidates} candidates in {prefetch_elapsed:.1f}s")

        # SELECT: Pick tracks from pre-fetched pools (no more API calls)
        for i, phase in enumerate(workout.phases):
            phase_duration_ms = phase.duration_min * MS_PER_MINUTE
            pool = track_pools.get(phase.name, [])

            if pool:
                phase_tracks = self._select_tracks_from_pool(
                    phase, pool, used_artists,
                    target_duration_ms=phase_duration_ms,
                    boost_artists=boost_artists,
                    hidden_tracks=hidden_tracks,
                )
            else:
                logger.warning(f"No tracks in pool for phase {phase.name}, trying direct search")
                phase_tracks = self._select_tracks_for_phase(
                    phase, phase_duration_ms, used_artists,
                    genre=genre, min_energy=min_energy,
                    boost_artists=boost_artists, hidden_tracks=hidden_tracks,
                )

            tracks.extend(phase_tracks)
            for track in phase_tracks:
                used_artists.add(track.artist)

            logger.info(f"Phase {i+1} ({phase.name}): {len(phase_tracks)} track(s)")

        playlist = Playlist(
            name=f"CrossFit: {workout.workout_name}",
            tracks=tracks,
            spotify_url=None,
        )

        logger.info(f"Composed playlist with {len(tracks)} tracks, "
                   f"total duration: {sum(t.duration_ms for t in tracks) / MS_PER_MINUTE:.1f} min")

        return playlist

    def _select_tracks_from_pool(
        self,
        phase: Phase,
        pool: list[Track],
        used_artists: set[str],
        target_duration_ms: int,
        boost_artists: Optional[set[str]] = None,
        hidden_tracks: Optional[set[str]] = None,
    ) -> list[Track]:
        """Select tracks from a pre-fetched pool to fill a phase duration."""
        scored = self.curator.score_candidates(
            pool, phase, used_artists,
            boost_artists=boost_artists,
            hidden_tracks=hidden_tracks,
        )

        phase_tracks = []
        accumulated_ms = 0
        max_duration = target_duration_ms + PHASE_DURATION_TOLERANCE_MS

        for track, score in scored:
            if accumulated_ms >= target_duration_ms:
                break
            if max_duration - accumulated_ms < MIN_REMAINING_DURATION_MS:
                break
            if accumulated_ms + track.duration_ms > max_duration and phase_tracks:
                continue

            phase_tracks.append(track)
            used_artists.add(track.artist)
            accumulated_ms += track.duration_ms

        # Ensure at least one track per phase
        if not phase_tracks and scored:
            phase_tracks.append(scored[0][0])

        return phase_tracks

    def _select_tracks_for_phase(
        self,
        phase: Phase,
        target_duration_ms: int,
        used_artists: set[str],
        genre: Optional[str] = None,
        min_energy: Optional[float] = None,
        boost_artists: Optional[set[str]] = None,
        hidden_tracks: Optional[set[str]] = None,
    ) -> list[Track]:
        """Fallback: select tracks via per-track API calls (used when pool is empty)."""
        phase_tracks = []
        accumulated_duration_ms = 0
        max_duration = target_duration_ms + PHASE_DURATION_TOLERANCE_MS
        max_iterations = 50

        while accumulated_duration_ms < target_duration_ms and max_iterations > 0:
            max_iterations -= 1
            remaining_ms = max_duration - accumulated_duration_ms
            if remaining_ms < MIN_REMAINING_DURATION_MS:
                break

            track = self.curator.select_track_for_phase(
                phase, used_artists,
                target_duration_ms=remaining_ms,
                genre=genre, min_energy=min_energy,
                boost_artists=boost_artists, hidden_tracks=hidden_tracks,
            )

            if not track:
                logger.warning(f"Could not find more tracks for phase {phase.name}")
                break

            new_total = accumulated_duration_ms + track.duration_ms
            if new_total > max_duration and phase_tracks:
                break

            phase_tracks.append(track)
            used_artists.add(track.artist)
            accumulated_duration_ms += track.duration_ms

        if not phase_tracks:
            track = self.curator.select_track_for_phase(
                phase, used_artists, genre=genre, min_energy=min_energy,
                boost_artists=boost_artists, hidden_tracks=hidden_tracks,
            )
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

        # Check track count
        if len(playlist.tracks) > MAX_RECOMMENDED_TRACKS:
            logger.warning(f"Playlist has {len(playlist.tracks)} tracks, which is high")

        # Validate duration
        playlist_duration_min = sum(t.duration_ms for t in playlist.tracks) / MS_PER_MINUTE
        duration_diff = abs(playlist_duration_min - workout.total_duration_min)

        if duration_diff > MAX_DURATION_DIFF_MIN:
            return False, (f"Playlist duration ({playlist_duration_min:.1f} min) "
                          f"doesn't match workout ({workout.total_duration_min} min)")

        # Check for artist diversity
        artists = [t.artist for t in playlist.tracks]
        unique_artists = set(artists)

        if len(unique_artists) < len(artists) * MIN_ARTIST_DIVERSITY:
            logger.warning("Low artist diversity in playlist")

        # Validate BPM transitions
        for i in range(len(playlist.tracks) - 1):
            current_bpm = playlist.tracks[i].bpm
            next_bpm = playlist.tracks[i + 1].bpm
            bpm_jump = abs(next_bpm - current_bpm)

            if bpm_jump > MAX_BPM_JUMP:
                logger.warning(f"Large BPM jump between tracks {i} and {i+1}: {bpm_jump} BPM")
        
        logger.info(f"Playlist validation passed: {len(playlist.tracks)} tracks, "
                   f"{playlist_duration_min:.1f} min duration")
        return True, None
    
    def compose_and_validate(
        self,
        workout: WorkoutStructure,
        genre: Optional[str] = None,
        min_energy: Optional[float] = None,
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
        hidden_tracks: Optional[set[str]] = None,
    ) -> Playlist:
        """
        Complete workflow: compose and validate playlist.

        Args:
            workout: Parsed workout structure
            genre: Optional genre override from user preferences
            min_energy: Optional minimum energy override
            exclude_artists: Optional set of artists to exclude
            boost_artists: Optional set of artists to boost (from positive feedback)
            hidden_tracks: Optional set of track IDs to exclude (from negative feedback)

        Returns:
            Validated playlist

        Raises:
            ValueError: If validation fails
        """
        # Compose
        playlist = self.compose(
            workout, genre=genre, min_energy=min_energy,
            exclude_artists=exclude_artists,
            boost_artists=boost_artists, hidden_tracks=hidden_tracks,
        )
        
        # Validate
        is_valid, error_msg = self.validate_playlist(playlist, workout)
        if not is_valid:
            raise ValueError(f"Invalid playlist: {error_msg}")
        
        return playlist

