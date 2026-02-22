"""
Hybrid music source: Deezer primary, Claude fallback.
"""
import logging
from typing import Optional

from music_sources.base import MusicSource, TrackCandidate

logger = logging.getLogger(__name__)

MIN_COVERAGE_RATIO = 0.5


class HybridMusicSource(MusicSource):
    """Deezer first, Claude fallback per phase."""

    def __init__(self, deezer=None, claude=None):
        if deezer:
            self._deezer = deezer
        else:
            from music_sources.deezer import DeezerMusicSource
            self._deezer = DeezerMusicSource()

        if claude:
            self._claude = claude
        else:
            from music_sources.claude_suggestions import ClaudeMusicSource
            self._claude = ClaudeMusicSource()

    @property
    def name(self) -> str:
        return "hybrid"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        candidates = self._deezer.search_by_bpm(bpm_min, bpm_max, genre, limit)

        if len(candidates) >= max(1, int(limit * MIN_COVERAGE_RATIO)):
            logger.info(f"Hybrid: Deezer provided {len(candidates)} tracks (sufficient)")
            return candidates

        logger.info(f"Hybrid: Deezer returned {len(candidates)}, falling back to Claude")
        claude_candidates = self._claude.search_by_bpm(bpm_min, bpm_max, genre, limit)

        seen_artists = {c.artist for c in candidates}
        for c in claude_candidates:
            if c.artist not in seen_artists:
                candidates.append(c)
                seen_artists.add(c.artist)

        return candidates[:limit]

    def batch_search(
        self,
        phases_info: list[dict],
        genre: str = "rock",
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
    ) -> dict[str, list[TrackCandidate]]:
        result = {}
        for p in phases_info:
            deezer_tracks = self._deezer.search_by_bpm(p["bpm_min"], p["bpm_max"], genre, limit=20)
            if len(deezer_tracks) >= 5:
                result[p["name"]] = deezer_tracks
            else:
                claude_tracks = self._claude.search_by_bpm(p["bpm_min"], p["bpm_max"], genre, limit=20)
                seen = {t.artist for t in deezer_tracks}
                merged = list(deezer_tracks)
                for t in claude_tracks:
                    if t.artist not in seen:
                        merged.append(t)
                        seen.add(t.artist)
                result[p["name"]] = merged
        return result
