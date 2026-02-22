"""
Claude + Deezer verification music source.
Claude suggests songs, Deezer confirms they exist and provides verified BPM.
"""
import logging
from typing import Optional

import requests

from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)

DEEZER_SEARCH_URL = "https://api.deezer.com/search"
DEEZER_TRACK_URL = "https://api.deezer.com/track"
REQUEST_TIMEOUT = 5


class ClaudeDeezerVerifySource(MusicSource):
    """Claude suggests songs, Deezer verifies existence and BPM."""

    def __init__(self, claude_source=None):
        if claude_source:
            self._claude = claude_source
        else:
            from music_sources.claude_suggestions import ClaudeMusicSource
            self._claude = ClaudeMusicSource()

    @property
    def name(self) -> str:
        return "claude_deezer_verify"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        candidates = self._claude.search_by_bpm(bpm_min, bpm_max, genre, limit)
        verified = []
        for c in candidates:
            result = self._verify_with_deezer(c, bpm_min, bpm_max)
            verified.append(result)
        logger.info(f"Claude+Deezer verify: {sum(1 for c in verified if c.verified_bpm)}/{len(verified)} verified")
        return verified

    def batch_search(
        self,
        phases_info: list[dict],
        genre: str = "rock",
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
    ) -> dict[str, list[TrackCandidate]]:
        raw = self._claude.batch_search(phases_info, genre, exclude_artists, boost_artists)
        result = {}
        for phase_name, candidates in raw.items():
            verified = []
            phase_info = next((p for p in phases_info if p["name"] == phase_name), None)
            bpm_min = phase_info["bpm_min"] if phase_info else 80
            bpm_max = phase_info["bpm_max"] if phase_info else 180
            for c in candidates:
                verified.append(self._verify_with_deezer(c, bpm_min, bpm_max))
            result[phase_name] = verified
        return result

    def _verify_with_deezer(self, candidate: TrackCandidate, bpm_min: int, bpm_max: int) -> TrackCandidate:
        try:
            query = f'track:"{candidate.name}" artist:"{candidate.artist}"'
            resp = requests.get(DEEZER_SEARCH_URL, params={"q": query, "limit": 1}, timeout=REQUEST_TIMEOUT)
            if resp.status_code != 200 or not resp.json().get("data"):
                return candidate

            track_id = resp.json()["data"][0]["id"]
            detail = requests.get(f"{DEEZER_TRACK_URL}/{track_id}", timeout=REQUEST_TIMEOUT)
            if detail.status_code != 200:
                return candidate

            deezer_bpm = float(detail.json().get("bpm", 0))

            if deezer_bpm > 0:
                return TrackCandidate(
                    name=candidate.name,
                    artist=candidate.artist,
                    bpm=int(deezer_bpm),
                    energy=candidate.energy,
                    duration_ms=candidate.duration_ms,
                    source="claude_deezer_verify",
                    source_id=str(track_id),
                    verified_bpm=True,
                )
            else:
                return candidate

        except Exception as e:
            logger.debug(f"Deezer verify failed for {candidate.name}: {e}")
            return candidate
