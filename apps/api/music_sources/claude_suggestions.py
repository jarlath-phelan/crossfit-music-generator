"""
Claude-based music suggestion source.
Asks Claude to suggest songs for a BPM range and genre.
Least reliable but most flexible — can incorporate preferences, mood, workout context.
Results are marked as "unverified" since Claude may hallucinate songs.
"""
import json
import logging
import math
import time as _time
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


BATCH_SUGGESTION_PROMPT = """Suggest real songs for a CrossFit workout playlist. The workout has {num_phases} phases.

Genre preference: {genre}

RULES:
- Only suggest REAL songs that actually exist. Do not make up songs.
- Each artist may appear AT MOST ONCE across ALL phases.
- BPM must be within each phase's specified range.
- Energy level should match the phase intensity (0.0-1.0).
{exclude_line}{boost_line}
PHASES:
{phases_text}

Return ONLY a JSON object with phase names as keys:
{{
  "Phase Name": [
    {{"title": "Song Name", "artist": "Artist Name", "bpm": 150, "energy": 0.85, "duration_sec": 210}},
    ...
  ]
}}"""


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

            start = _time.time()
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            elapsed = _time.time() - start
            logger.debug(f"Claude music suggestion API call: {elapsed:.1f}s, {response.usage.input_tokens}in/{response.usage.output_tokens}out")

            # Extract JSON from response
            text = response.content[0].text

            # Try to find JSON array in response
            start_idx = text.find("[")
            end_idx = text.rfind("]") + 1
            if start_idx >= 0 and end_idx > start_idx:
                songs = json.loads(text[start_idx:end_idx])
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
            else:
                logger.warning(f"Claude music response contained no JSON array. Response text: {text[:200]}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude music suggestions: {e}. Response text: {text[:200] if 'text' in dir() else 'N/A'}")
        except anthropic.APIError as e:
            logger.error(f"Claude API error for music suggestions: [{type(e).__name__}] {e}")
        except Exception as e:
            logger.error(f"Claude music source unexpected error: [{type(e).__name__}] {e}", exc_info=True)

        logger.info(f"Claude: suggested {len(candidates)} tracks for BPM {bpm_min}-{bpm_max}")
        return candidates

    def batch_search(
        self,
        phases_info: list[dict],
        genre: str = "rock",
        exclude_artists: Optional[set[str]] = None,
        boost_artists: Optional[set[str]] = None,
    ) -> dict[str, list[TrackCandidate]]:
        """
        Single Claude API call to get track suggestions for ALL workout phases.

        Args:
            phases_info: List of dicts with keys: name, bpm_min, bpm_max, duration_min, energy
            genre: Music genre preference
            exclude_artists: Artists to never suggest
            boost_artists: Artists to prefer

        Returns:
            Dict mapping phase name → list of TrackCandidates
        """
        # Build phases text block
        phases_lines = []
        for i, p in enumerate(phases_info, 1):
            tracks_needed = math.ceil(p["duration_min"] / 3.5) + 3
            energy = p.get("energy", 0.7)
            phases_lines.append(
                f"{i}. {p['name']} ({p['duration_min']} min): "
                f"BPM {p['bpm_min']}-{p['bpm_max']}, energy ~{energy:.1f} "
                f"→ Suggest {tracks_needed} songs"
            )

        exclude_line = ""
        if exclude_artists:
            exclude_line = f"- Do NOT suggest songs by: {', '.join(sorted(exclude_artists))}\n"

        boost_line = ""
        if boost_artists:
            boost_line = f"- PREFER songs by these artists when possible: {', '.join(sorted(boost_artists))}\n"

        prompt = BATCH_SUGGESTION_PROMPT.format(
            num_phases=len(phases_info),
            genre=genre,
            exclude_line=exclude_line,
            boost_line=boost_line,
            phases_text="\n".join(phases_lines),
        )

        try:
            start = _time.time()
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            elapsed = _time.time() - start
            logger.info(
                f"Claude batch music suggestion: {elapsed:.1f}s, "
                f"{response.usage.input_tokens}in/{response.usage.output_tokens}out "
                f"({len(phases_info)} phases)"
            )

            text = response.content[0].text

            # Extract JSON object from response
            start_idx = text.find("{")
            end_idx = text.rfind("}") + 1
            if start_idx < 0 or end_idx <= start_idx:
                logger.warning(f"Claude batch response contained no JSON object. Response: {text[:300]}")
                return {}

            raw = json.loads(text[start_idx:end_idx])

            # Convert to TrackCandidates grouped by phase name
            result: dict[str, list[TrackCandidate]] = {}
            for phase_name, songs in raw.items():
                candidates = []
                # Find matching phase info for BPM validation
                phase_info = next((p for p in phases_info if p["name"] == phase_name), None)
                for song in songs:
                    bpm = int(song.get("bpm", 0))
                    if phase_info and not (phase_info["bpm_min"] <= bpm <= phase_info["bpm_max"]):
                        continue
                    candidates.append(
                        TrackCandidate(
                            name=song.get("title", "Unknown"),
                            artist=song.get("artist", "Unknown"),
                            bpm=bpm,
                            energy=float(song.get("energy", 0.7)),
                            duration_ms=int(song.get("duration_sec", 210)) * 1000,
                            source="claude",
                            verified_bpm=False,
                        )
                    )
                result[phase_name] = candidates

            total_tracks = sum(len(v) for v in result.values())
            logger.info(f"Claude batch: {total_tracks} tracks across {len(result)} phases")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude batch response: {e}")
            return {}
        except anthropic.APIError as e:
            logger.error(f"Claude API error for batch music suggestions: [{type(e).__name__}] {e}")
            return {}
        except Exception as e:
            logger.error(f"Claude batch music unexpected error: [{type(e).__name__}] {e}", exc_info=True)
            return {}
