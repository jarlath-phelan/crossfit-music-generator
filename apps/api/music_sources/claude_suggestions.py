"""
Claude-based music suggestion source.
Asks Claude to suggest songs for a BPM range and genre.
Least reliable but most flexible — can incorporate preferences, mood, workout context.
Results are marked as "unverified" since Claude may hallucinate songs.
"""
import logging
from typing import Optional

import anthropic

from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)

SUGGESTION_PROMPT = """Suggest {limit} real songs that would work well for a CrossFit workout at {bpm_min}-{bpm_max} BPM.

Genre preference: {genre}

For each song, provide:
- Song title (must be a REAL song that exists)
- Artist name
- Approximate BPM (must be between {bpm_min} and {bpm_max})
- Energy level (0.0-1.0, where 1.0 is maximum energy)
- Approximate duration in seconds

Return ONLY a JSON array with this format:
[
  {{"title": "Song Name", "artist": "Artist Name", "bpm": 150, "energy": 0.85, "duration_sec": 210}}
]

Important: Only suggest songs you are confident actually exist. Do not make up songs."""


class ClaudeMusicSource(MusicSource):
    """Music source that asks Claude to suggest songs. Results are unverified."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model or settings.anthropic_model
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required for Claude music source")
        self.client = anthropic.Anthropic(api_key=self.api_key)

    @property
    def name(self) -> str:
        return "claude"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
    ) -> list[TrackCandidate]:
        """Ask Claude to suggest songs for a BPM range."""
        candidates = []

        try:
            prompt = SUGGESTION_PROMPT.format(
                limit=limit,
                bpm_min=bpm_min,
                bpm_max=bpm_max,
                genre=genre,
            )

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract JSON from response
            text = response.content[0].text
            import json

            # Try to find JSON array in response
            start = text.find("[")
            end = text.rfind("]") + 1
            if start >= 0 and end > start:
                songs = json.loads(text[start:end])
                for song in songs[:limit]:
                    bpm = int(song.get("bpm", 0))
                    if bpm_min <= bpm <= bpm_max:
                        candidates.append(
                            TrackCandidate(
                                name=song.get("title", "Unknown"),
                                artist=song.get("artist", "Unknown"),
                                bpm=bpm,
                                energy=float(song.get("energy", 0.7)),
                                duration_ms=int(song.get("duration_sec", 210)) * 1000,
                                source="claude",
                                verified_bpm=False,  # Claude suggestions are unverified
                            )
                        )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude music suggestions: {e}")
        except anthropic.APIError as e:
            logger.error(f"Claude API error for music suggestions: {e}")
        except Exception as e:
            logger.error(f"Claude music source unexpected error: {e}")

        logger.info(f"Claude: suggested {len(candidates)} tracks for BPM {bpm_min}-{bpm_max}")
        return candidates
