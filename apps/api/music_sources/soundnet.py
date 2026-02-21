"""
SoundNet music source via RapidAPI.
Track Analysis API providing BPM, energy, key, and danceability data.
Free tier: 1000 requests/hour, 500K requests/month.
"""
import logging
from typing import Optional

import httpx

from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)

SOUNDNET_API_URL = "https://track-analysis.p.rapidapi.com"


class SoundNetMusicSource(MusicSource):
    """Music source using SoundNet Track Analysis API via RapidAPI."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.soundnet_api_key
        if not self.api_key:
            raise ValueError("SOUNDNET_API_KEY is required for SoundNet music source")

    @property
    def name(self) -> str:
        return "soundnet"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        """
        Search SoundNet for tracks in a BPM range with energy data.
        """
        candidates = []

        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    f"{SOUNDNET_API_URL}/v1/tracks/search",
                    params={
                        "bpm_min": bpm_min,
                        "bpm_max": bpm_max,
                        "genre": genre,
                        "limit": limit,
                    },
                    headers={
                        "X-RapidAPI-Key": self.api_key,
                        "X-RapidAPI-Host": "track-analysis.p.rapidapi.com",
                    },
                )
                response.raise_for_status()
                data = response.json()

            tracks = data.get("tracks", data) if isinstance(data, dict) else data
            if not isinstance(tracks, list):
                tracks = []

            for track in tracks[:limit]:
                bpm = int(track.get("bpm", track.get("tempo", 0)))
                if bpm_min <= bpm <= bpm_max:
                    candidates.append(
                        TrackCandidate(
                            name=track.get("title", track.get("name", "Unknown")),
                            artist=track.get("artist", "Unknown"),
                            bpm=bpm,
                            energy=float(track.get("energy", 0.5)),
                            duration_ms=int(track.get("duration_ms", 210000)),
                            source="soundnet",
                            source_id=track.get("id"),
                            album=track.get("album"),
                            verified_bpm=True,
                        )
                    )

        except httpx.HTTPError as e:
            logger.error(f"SoundNet API error: {e}")
        except Exception as e:
            logger.error(f"SoundNet unexpected error: {e}")

        logger.info(f"SoundNet: found {len(candidates)} tracks for BPM {bpm_min}-{bpm_max}")
        return candidates
