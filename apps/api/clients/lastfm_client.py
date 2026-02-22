"""
Last.fm API client for similar artist discovery.
Free API, requires only an API key (no OAuth).
"""
import logging
from typing import Optional

import requests

from config import settings

logger = logging.getLogger(__name__)

LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/"


class LastFmClient:
    """Client for Last.fm API — similar artists and tags."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.lastfm_api_key
        if not self.api_key:
            logger.warning("LASTFM_API_KEY not set — Last.fm features unavailable")

    def get_similar_artists(self, artist: str, limit: int = 10) -> list[str]:
        if not self.api_key:
            return []
        try:
            resp = requests.get(LASTFM_API_URL, params={
                "method": "artist.getSimilar",
                "artist": artist,
                "api_key": self.api_key,
                "format": "json",
                "limit": limit,
            }, timeout=5)
            if resp.status_code != 200:
                return []
            data = resp.json()
            artists = data.get("similarartists", {}).get("artist", [])
            return [a["name"] for a in artists[:limit]]
        except Exception as e:
            logger.error(f"Last.fm error: [{type(e).__name__}] {e}")
            return []

    def get_artist_tags(self, artist: str, limit: int = 5) -> list[str]:
        if not self.api_key:
            return []
        try:
            resp = requests.get(LASTFM_API_URL, params={
                "method": "artist.getTopTags",
                "artist": artist,
                "api_key": self.api_key,
                "format": "json",
            }, timeout=5)
            if resp.status_code != 200:
                return []
            data = resp.json()
            tags = data.get("toptags", {}).get("tag", [])
            return [t["name"] for t in tags[:limit]]
        except Exception as e:
            logger.error(f"Last.fm tags error: [{type(e).__name__}] {e}")
            return []
