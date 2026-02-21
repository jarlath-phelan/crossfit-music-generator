"""
Mock music source wrapping the existing in-memory track database.
Used for offline development and testing.
"""
import logging
from typing import Optional

from music_sources.base import MusicSource, TrackCandidate
from mocks.spotify_mock import MockSpotifyClient

logger = logging.getLogger(__name__)


class MockMusicSource(MusicSource):
    """Music source backed by the in-memory mock track database."""

    def __init__(self):
        self._client = MockSpotifyClient()

    @property
    def name(self) -> str:
        return "mock"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        tracks = self._client.search_tracks(
            bpm_min=bpm_min,
            bpm_max=bpm_max,
            min_energy=0.0,
            max_energy=1.0,
            limit=limit,
        )

        return [
            TrackCandidate(
                name=t.name,
                artist=t.artist,
                bpm=t.bpm,
                energy=t.energy,
                duration_ms=t.duration_ms,
                source="mock",
                source_id=t.id,
                verified_bpm=True,  # Our mock data has accurate BPM
            )
            for t in tracks
        ]
