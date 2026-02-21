"""
Abstract base class for pluggable music sources.
All music sources implement this interface to search tracks by BPM range.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TrackCandidate:
    """A track found by a music source, before Spotify resolution."""

    name: str
    artist: str
    bpm: int
    energy: float  # 0.0-1.0
    duration_ms: int
    source: str  # which music source found this ("mock", "getsongbpm", "soundnet", "claude")
    source_id: Optional[str] = None  # ID in the source system
    album: Optional[str] = None
    year: Optional[int] = None
    verified_bpm: bool = False  # True if BPM comes from audio analysis, not metadata


class MusicSource(ABC):
    """Abstract interface for music track discovery by BPM range."""

    @abstractmethod
    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        """
        Search for tracks within a BPM range.

        Args:
            bpm_min: Minimum BPM (inclusive)
            bpm_max: Maximum BPM (inclusive)
            genre: Preferred genre
            limit: Maximum number of results

        Returns:
            List of TrackCandidate objects
        """
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this music source."""
        ...
