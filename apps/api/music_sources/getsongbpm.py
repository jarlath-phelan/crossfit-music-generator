"""
GetSongBPM music source.
Free API for searching songs by BPM. Requires attribution link.
API docs: https://getsongbpm.com/api
"""
import logging
from typing import Optional

import httpx

from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)

GETSONGBPM_API_URL = "https://api.getsongbpm.com"


class GetSongBPMMusicSource(MusicSource):
    """Music source using the GetSongBPM API for BPM-based track discovery."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.getsongbpm_api_key
        if not self.api_key:
            raise ValueError("GETSONGBPM_API_KEY is required for GetSongBPM music source")

    @property
    def name(self) -> str:
        return "getsongbpm"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        """
        Search GetSongBPM for tracks in a BPM range.

        The API supports tempo search which returns songs near a target BPM.
        We search at the midpoint of the range and filter results.
        """
        target_bpm = (bpm_min + bpm_max) // 2
        candidates = []

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{GETSONGBPM_API_URL}/tempo/",
                    params={
                        "api_key": self.api_key,
                        "bpm": target_bpm,
                    },
                )
                response.raise_for_status()
                data = response.json()

            songs = data.get("tempo", [])
            for song in songs[:limit * 2]:  # Fetch extra to filter
                song_bpm = int(song.get("song_tempo", 0))
                if bpm_min <= song_bpm <= bpm_max:
                    candidates.append(
                        TrackCandidate(
                            name=song.get("song_title", "Unknown"),
                            artist=song.get("artist", {}).get("name", "Unknown"),
                            bpm=song_bpm,
                            energy=self._estimate_energy(song_bpm),
                            duration_ms=210000,  # Default ~3.5 min, API doesn't provide duration
                            source="getsongbpm",
                            source_id=song.get("song_id"),
                            album=song.get("album", {}).get("title"),
                            year=self._parse_year(song.get("album", {}).get("year")),
                            verified_bpm=True,
                        )
                    )

                if len(candidates) >= limit:
                    break

        except httpx.HTTPError as e:
            logger.error(f"GetSongBPM API error: {e}")
        except Exception as e:
            logger.error(f"GetSongBPM unexpected error: {e}")

        logger.info(f"GetSongBPM: found {len(candidates)} tracks for BPM {bpm_min}-{bpm_max}")
        return candidates

    @staticmethod
    def _estimate_energy(bpm: int) -> float:
        """Estimate energy level from BPM (rough heuristic)."""
        if bpm < 100:
            return 0.3
        elif bpm < 120:
            return 0.5
        elif bpm < 140:
            return 0.65
        elif bpm < 160:
            return 0.8
        else:
            return 0.9

    @staticmethod
    def _parse_year(year_str) -> Optional[int]:
        if year_str:
            try:
                return int(str(year_str)[:4])
            except (ValueError, TypeError):
                pass
        return None
