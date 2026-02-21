"""
MusicCuratorAgent: Curates music tracks matching workout phase requirements
"""
import logging
from typing import Optional
from models.schemas import Phase, Track
from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)


def create_music_source() -> MusicSource:
    """Factory function to create the configured music source."""
    source_name = settings.music_source.lower()

    if source_name == "getsongbpm":
        from music_sources.getsongbpm import GetSongBPMMusicSource
        return GetSongBPMMusicSource()
    elif source_name == "soundnet":
        from music_sources.soundnet import SoundNetMusicSource
        return SoundNetMusicSource()
    elif source_name == "claude":
        from music_sources.claude_suggestions import ClaudeMusicSource
        return ClaudeMusicSource()
    else:
        from music_sources.mock_source import MockMusicSource
        return MockMusicSource()


class MusicCuratorAgent:
    """
    Agent responsible for finding and ranking tracks that match workout phases.

    Uses a pluggable music source to search tracks by BPM, then scores
    and ranks candidates based on BPM match, energy, and artist diversity.
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

    def __init__(self, music_source: Optional[MusicSource] = None):
        """Initialize the agent with a music source."""
        if music_source:
            self.source = music_source
        else:
            self.source = create_music_source()
        logger.info(f"Using music source: {self.source.name}")

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

        # Search via pluggable music source
        candidates = self.source.search_by_bpm(
            bpm_min=bpm_min,
            bpm_max=bpm_max,
            genre=genre or self.DEFAULT_GENRE,
            limit=limit,
        )

        # Convert TrackCandidates to Tracks, filtering by energy
        tracks = []
        for c in candidates:
            if c.energy >= min_energy:
                tracks.append(
                    Track(
                        id=c.source_id or f"{c.source}:{c.name}:{c.artist}",
                        name=c.name,
                        artist=c.artist,
                        bpm=c.bpm,
                        energy=c.energy,
                        duration_ms=c.duration_ms,
                    )
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

        if not scored_candidates:
            logger.warning(f"No scored candidates for phase {phase.name}")
            return None

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
        logger.debug(f"Learning from feedback for track {track.id}: {feedback}")
        pass
