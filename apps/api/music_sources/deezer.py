"""
Deezer-based music source.
Uses Deezer's free, unauthenticated API for BPM-based track discovery.
BPM data coverage is incomplete — tracks with BPM=0 are filtered out.
"""
import logging
import time as _time
from typing import Optional

import requests

from music_sources.base import MusicSource, TrackCandidate

logger = logging.getLogger(__name__)

DEEZER_SEARCH_URL = "https://api.deezer.com/search"
DEEZER_TRACK_URL = "https://api.deezer.com/track"
REQUEST_TIMEOUT = 10


class DeezerMusicSource(MusicSource):
    """Music source using Deezer's free search API with BPM range filtering."""

    @property
    def name(self) -> str:
        return "deezer"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        candidates = []

        try:
            query = f'{genre} bpm_min:"{bpm_min}" bpm_max:"{bpm_max}"'
            params = {"q": query, "limit": min(limit * 3, 100)}

            start = _time.time()
            resp = requests.get(DEEZER_SEARCH_URL, params=params, timeout=REQUEST_TIMEOUT)
            elapsed = _time.time() - start

            if resp.status_code != 200:
                logger.error(f"Deezer search failed: HTTP {resp.status_code}")
                return []

            data = resp.json()
            tracks = data.get("data", [])
            logger.info(f"Deezer search: {len(tracks)} results in {elapsed:.1f}s for BPM {bpm_min}-{bpm_max} ({genre})")

            for track_data in tracks:
                if len(candidates) >= limit:
                    break

                track_id = track_data.get("id")
                if not track_id:
                    continue

                try:
                    detail_resp = requests.get(
                        f"{DEEZER_TRACK_URL}/{track_id}",
                        timeout=REQUEST_TIMEOUT,
                    )
                    if detail_resp.status_code != 200:
                        continue

                    detail = detail_resp.json()
                    bpm = float(detail.get("bpm", 0))

                    if bpm <= 0:
                        continue

                    if not (bpm_min <= bpm <= bpm_max):
                        continue

                    artist_name = track_data.get("artist", {}).get("name", "Unknown")
                    duration_sec = track_data.get("duration", 210)
                    rank = track_data.get("rank", 0)
                    energy = min(1.0, max(0.3, rank / 1_000_000))

                    candidates.append(
                        TrackCandidate(
                            name=track_data.get("title", "Unknown"),
                            artist=artist_name,
                            bpm=int(bpm),
                            energy=energy,
                            duration_ms=duration_sec * 1000,
                            source="deezer",
                            source_id=str(track_id),
                            verified_bpm=True,
                        )
                    )

                except requests.RequestException:
                    continue

        except Exception as e:
            logger.error(f"Deezer music source error: [{type(e).__name__}] {e}")

        logger.info(f"Deezer: {len(candidates)} verified tracks for BPM {bpm_min}-{bpm_max}")
        return candidates
