"""
Two-step Claude music source.
Step 1: Claude generates a large candidate pool (40-50 tracks).
Step 2: Claude re-ranks the top 15-20 candidates with workout context.
"""
import json
import logging
import random
import time as _time
from typing import Optional

import anthropic

from music_sources.base import MusicSource, TrackCandidate
from config import settings

logger = logging.getLogger(__name__)

GENERATE_PROMPT = """Suggest {limit} real songs for a CrossFit workout at {bpm_min}-{bpm_max} BPM.

Genre preference: {genre}

RULES:
- Only suggest REAL songs that actually exist.
- Each artist may appear AT MOST ONCE.
- BPM must be between {bpm_min} and {bpm_max}.
- Energy level must be at least 0.6.
{boost_line}
Return ONLY a JSON array:
[{{"title": "Song Name", "artist": "Artist Name", "bpm": 150, "energy": 0.85, "duration_sec": 210}}]"""

RERANK_PROMPT = """You are a CrossFit workout DJ. Re-rank these candidate tracks for a {intensity} intensity workout phase.

Target BPM: {bpm_min}-{bpm_max}
Genre: {genre}

Candidates:
{candidates_text}

Select the best {select_count} tracks. Consider:
- BPM fit within the target range
- Energy match for {intensity} intensity
- Artist variety
- Workout motivation and vibe

Return ONLY a JSON array of selected indices (0-based) with brief reasons:
[{{"index": 0, "reason": "perfect energy"}}, ...]"""


class TwoStepClaudeMusicSource(MusicSource):
    """Two-step: Claude generates large pool, then re-ranks top candidates."""

    def __init__(self):
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    @property
    def name(self) -> str:
        return "claude_two_step"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
        boost_artists: Optional[set[str]] = None,
    ) -> list[TrackCandidate]:
        pool_size = max(limit * 4, 40)
        boost_line = ""
        if boost_artists:
            boost_line = f"- PREFER songs by: {', '.join(sorted(boost_artists))}\n"

        prompt = GENERATE_PROMPT.format(
            limit=pool_size, bpm_min=bpm_min, bpm_max=bpm_max,
            genre=genre, boost_line=boost_line,
        )

        try:
            start = _time.time()
            gen_resp = self.client.messages.create(
                model=self.model, max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            gen_elapsed = _time.time() - start
            logger.info(f"Two-step generate: {gen_elapsed:.1f}s, "
                        f"{gen_resp.usage.input_tokens}in/{gen_resp.usage.output_tokens}out")

            text = gen_resp.content[0].text
            start_idx = text.find("[")
            end_idx = text.rfind("]") + 1
            if start_idx < 0 or end_idx <= start_idx:
                return []

            songs = json.loads(text[start_idx:end_idx])

            candidates = []
            for song in songs:
                bpm = int(song.get("bpm", 0))
                if bpm_min <= bpm <= bpm_max:
                    candidates.append(
                        TrackCandidate(
                            name=song.get("title", "Unknown"),
                            artist=song.get("artist", "Unknown"),
                            bpm=bpm,
                            energy=float(song.get("energy", 0.7)),
                            duration_ms=int(song.get("duration_sec", 210)) * 1000,
                            source="claude_two_step",
                            verified_bpm=False,
                        )
                    )

            if len(candidates) <= limit:
                return candidates

            # Step 2: Re-rank
            rerank_pool = candidates[:min(20, len(candidates))]
            random.shuffle(rerank_pool)

            candidates_text = "\n".join(
                f'{i}. "{c.name}" - {c.artist} (BPM: {c.bpm}, Energy: {c.energy:.2f})'
                for i, c in enumerate(rerank_pool)
            )

            rerank_prompt = RERANK_PROMPT.format(
                intensity="high", bpm_min=bpm_min, bpm_max=bpm_max,
                genre=genre, candidates_text=candidates_text,
                select_count=limit,
            )

            start = _time.time()
            rank_resp = self.client.messages.create(
                model=self.model, max_tokens=1024,
                messages=[{"role": "user", "content": rerank_prompt}],
            )
            rank_elapsed = _time.time() - start
            logger.info(f"Two-step re-rank: {rank_elapsed:.1f}s")

            rank_text = rank_resp.content[0].text
            r_start = rank_text.find("[")
            r_end = rank_text.rfind("]") + 1
            if r_start < 0 or r_end <= r_start:
                return candidates[:limit]

            rankings = json.loads(rank_text[r_start:r_end])
            reranked = []
            for entry in rankings[:limit]:
                idx = entry.get("index", 0)
                if 0 <= idx < len(rerank_pool):
                    reranked.append(rerank_pool[idx])

            return reranked if reranked else candidates[:limit]

        except Exception as e:
            logger.error(f"Two-step Claude error: [{type(e).__name__}] {e}")
            return []
