"""
Artist expansion service.
Expands a list of liked artists into similar artists using Last.fm, Claude, or both.
"""
import json
import logging
from typing import Optional

import anthropic

from config import settings

logger = logging.getLogger(__name__)


class ArtistExpansionService:
    """Expand liked artists to discover similar artists."""

    def __init__(self, strategy: str = "claude", lastfm_client=None):
        self.strategy = strategy
        self._lastfm = lastfm_client

    def _get_lastfm(self):
        if self._lastfm:
            return self._lastfm
        from clients.lastfm_client import LastFmClient
        self._lastfm = LastFmClient()
        return self._lastfm

    def expand(self, liked_artists: list[str], limit_per_artist: int = 5) -> list[str]:
        if self.strategy == "lastfm":
            return self._expand_lastfm(liked_artists, limit_per_artist)
        elif self.strategy == "claude":
            return self._expand_claude(liked_artists, limit_per_artist)
        elif self.strategy == "hybrid":
            return self._expand_hybrid(liked_artists, limit_per_artist)
        else:
            logger.warning(f"Unknown expansion strategy: {self.strategy}")
            return []

    def _expand_lastfm(self, artists: list[str], limit: int) -> list[str]:
        lastfm = self._get_lastfm()
        expanded = set()
        for artist in artists:
            similar = lastfm.get_similar_artists(artist, limit=limit)
            expanded.update(similar)
        expanded -= set(artists)
        return list(expanded)

    def _expand_claude(self, artists: list[str], limit: int) -> list[str]:
        try:
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            prompt = (
                f"Given these artists that a CrossFit athlete likes: {', '.join(artists)}\n\n"
                f"Suggest {limit * len(artists)} similar artists that would work well for workout playlists. "
                f"Return ONLY a JSON array of artist names: [\"Artist 1\", \"Artist 2\", ...]"
            )
            resp = client.messages.create(
                model=settings.anthropic_model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text
            s = text.find("[")
            e = text.rfind("]") + 1
            if s >= 0 and e > s:
                result = json.loads(text[s:e])
                return [a for a in result if a not in artists]
        except Exception as e:
            logger.error(f"Claude expansion error: {e}")
        return []

    def _expand_hybrid(self, artists: list[str], limit: int) -> list[str]:
        expanded = self._expand_lastfm(artists, limit)
        if len(expanded) >= len(artists) * 3:
            return expanded
        claude_expanded = self._expand_claude(artists, limit)
        combined = set(expanded)
        combined.update(claude_expanded)
        return list(combined)
