"""
MusicCuratorAgent: Curates music tracks matching workout phase requirements
"""
import logging
import random
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
    elif source_name == "deezer":
        from music_sources.deezer import DeezerMusicSource
        return DeezerMusicSource()
    elif source_name == "claude_deezer_verify":
        from music_sources.claude_deezer_verify import ClaudeDeezerVerifySource
        return ClaudeDeezerVerifySource()
    elif source_name == "claude_two_step":
        from music_sources.claude_two_step import TwoStepClaudeMusicSource
        return TwoStepClaudeMusicSource()
    elif source_name == "hybrid":
        from music_sources.hybrid import HybridMusicSource
        return HybridMusicSource()
    elif source_name == "deezer_claude_rerank":
        from music_sources.deezer_claude_rerank import DeezerClaudeRerankSource
        return DeezerClaudeRerankSource()
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
                     genre: Optional[str] = None,
                     min_energy: Optional[float] = None) -> list[Track]:
        """
        Search for tracks matching phase requirements.

        Args:
            phase: Workout phase with BPM and intensity requirements
            limit: Maximum number of tracks to return
            genre: Music genre preference (defaults to rock)
            min_energy: Minimum energy override (uses intensity default if None)

        Returns:
            List of candidate tracks
        """
        bpm_min, bpm_max = phase.bpm_range
        if min_energy is None:
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
                        used_artists: set[str],
                        boost_artists: Optional[set[str]] = None,
                        hidden_tracks: Optional[set[str]] = None) -> list[tuple[Track, float]]:
        """
        Score and rank candidate tracks for a phase.

        Args:
            tracks: Candidate tracks
            phase: Target phase requirements
            used_artists: Set of artists already used (to avoid repeats)
            boost_artists: Artists to boost from positive feedback (+15 pts)
            hidden_tracks: Track IDs to filter out from negative feedback

        Returns:
            List of (track, score) tuples, sorted by score descending
        """
        bpm_min, bpm_max = phase.bpm_range
        target_bpm = (bpm_min + bpm_max) / 2
        target_energy = self.DEFAULT_MIN_ENERGY.get(phase.intensity, 0.5)

        # Filter out hidden tracks
        if hidden_tracks:
            tracks = [t for t in tracks if t.id not in hidden_tracks]

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

            # Boost artists from positive feedback - 15 bonus points
            if boost_artists and track.artist in boost_artists:
                score += 15

            scored_tracks.append((track, score))

        # Sort by score descending
        scored_tracks.sort(key=lambda x: x[1], reverse=True)

        return scored_tracks

    def select_track_for_phase(self,
                              phase: Phase,
                              used_artists: set[str],
                              target_duration_ms: Optional[int] = None,
                              genre: Optional[str] = None,
                              min_energy: Optional[float] = None,
                              boost_artists: Optional[set[str]] = None,
                              hidden_tracks: Optional[set[str]] = None) -> Optional[Track]:
        """
        Select the best track for a workout phase.

        Args:
            phase: Workout phase requirements
            used_artists: Artists already used in playlist
            target_duration_ms: Preferred track duration (optional)
            genre: Optional genre override
            min_energy: Optional minimum energy override
            boost_artists: Artists to boost from positive feedback
            hidden_tracks: Track IDs to filter out from negative feedback

        Returns:
            Selected track or None if no suitable tracks found
        """
        # Search for candidates
        candidates = self.search_tracks(phase, limit=20, genre=genre, min_energy=min_energy)

        if not candidates:
            logger.warning(f"No tracks found for phase {phase.name}")
            return None

        # Score and rank candidates
        scored_candidates = self.score_candidates(
            candidates, phase, used_artists,
            boost_artists=boost_artists, hidden_tracks=hidden_tracks,
        )

        if not scored_candidates:
            logger.warning(f"No scored candidates for phase {phase.name}")
            return None

        # Select from top candidates with weighted probability
        top_n = scored_candidates[:5]
        weights = [score for _, score in top_n]
        total = sum(weights)
        if total <= 0:
            best_track = top_n[0][0]
        else:
            normalized = [w / total for w in weights]
            best_track = random.choices(
                [t for t, _ in top_n], weights=normalized, k=1
            )[0]
        logger.info(f"Selected '{best_track.name}' by {best_track.artist} "
                   f"for {phase.name} (from top {len(top_n)} candidates)")

        return best_track

    def batch_search_tracks(
        self,
        phases: list[Phase],
        genre: Optional[str] = None,
        min_energy: Optional[float] = None,
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
    ) -> dict[str, list[Track]]:
        """
        Search for tracks across all phases. Uses a single API call if the source supports it,
        otherwise falls back to per-phase search.

        Returns:
            Dict mapping phase name → list of candidate Tracks
        """
        effective_genre = genre or self.DEFAULT_GENRE

        # Use batch search if the source supports it (e.g. ClaudeMusicSource)
        if hasattr(self.source, 'batch_search'):
            phases_info = []
            for phase in phases:
                bpm_min, bpm_max = phase.bpm_range
                energy = min_energy or self.DEFAULT_MIN_ENERGY.get(phase.intensity, 0.5)
                phases_info.append({
                    "name": phase.name,
                    "bpm_min": bpm_min,
                    "bpm_max": bpm_max,
                    "duration_min": phase.duration_min,
                    "energy": energy,
                })

            raw_results = self.source.batch_search(
                phases_info,
                genre=effective_genre,
                exclude_artists=exclude_artists,
                boost_artists=boost_artists,
            )

            if raw_results:
                result = {}
                for phase in phases:
                    candidates = raw_results.get(phase.name, [])
                    # Relaxed energy filter for batch results: Claude already received
                    # energy guidance in the prompt, and the scoring function penalizes
                    # low-energy tracks. A strict filter here causes empty pools.
                    base_threshold = min_energy or self.DEFAULT_MIN_ENERGY.get(phase.intensity, 0.5)
                    energy_threshold = max(0.3, base_threshold - 0.2)
                    tracks = []
                    for c in candidates:
                        if c.energy >= energy_threshold:
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
                    result[phase.name] = tracks
                    logger.info(f"Batch: {len(tracks)} tracks for {phase.name}")
                return result
            else:
                logger.warning("Batch search returned empty, falling back to per-phase search")

        # Fallback: per-phase search (used by mock, getsongbpm, soundnet sources)
        logger.info("Using per-phase search")
        result = {}
        for phase in phases:
            result[phase.name] = self.search_tracks(
                phase, limit=20, genre=effective_genre, min_energy=min_energy,
            )
        return result

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
