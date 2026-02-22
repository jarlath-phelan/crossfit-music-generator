"""
Deezer + Claude re-rank music source.
Deezer provides BPM-verified candidates, Claude re-ranks top 15-20 with workout context.
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

RERANK_PROMPT = """You are a CrossFit workout DJ. Re-rank these candidate tracks for a workout phase.

Target BPM: {bpm_min}-{bpm_max}
Genre: {genre}
{taste_line}
Candidates:
{candidates_text}

Select the best {select_count} tracks. Consider:
- BPM fit, energy, artist variety, workout motivation.

Return ONLY a JSON array of selected indices (0-based):
[{{"index": 3}}, {{"index": 1}}, ...]"""


class DeezerClaudeRerankSource(MusicSource):
    """Deezer candidates, Claude re-ranks top 15-20."""

    def __init__(self, deezer=None):
        if deezer:
            self._deezer = deezer
        else:
            from music_sources.deezer import DeezerMusicSource
            self._deezer = DeezerMusicSource()

        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    @property
    def name(self) -> str:
        return "deezer_claude_rerank"

    def search_by_bpm(
        self,
        bpm_min: int,
        bpm_max: int,
        genre: str = "rock",
        limit: int = 10,
        taste_description: Optional[str] = None,
    ) -> list[TrackCandidate]:
        pool = self._deezer.search_by_bpm(bpm_min, bpm_max, genre, limit=min(50, limit * 5))

        if len(pool) <= limit:
            return pool

        rerank_pool = pool[:20]
        random.shuffle(rerank_pool)

        candidates_text = "\n".join(
            f'{i}. "{c.name}" - {c.artist} (BPM: {c.bpm}, Energy: {c.energy:.2f})'
            for i, c in enumerate(rerank_pool)
        )

        taste_line = f"User taste: {taste_description}\n" if taste_description else ""

        prompt = RERANK_PROMPT.format(
            bpm_min=bpm_min, bpm_max=bpm_max, genre=genre,
            taste_line=taste_line, candidates_text=candidates_text,
            select_count=limit,
        )

        try:
            start = _time.time()
            resp = self.client.messages.create(
                model=self.model, max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            elapsed = _time.time() - start
            logger.info(f"Deezer+Claude re-rank: {elapsed:.1f}s")

            text = resp.content[0].text
            s = text.find("[")
            e = text.rfind("]") + 1
            if s < 0 or e <= s:
                return pool[:limit]

            rankings = json.loads(text[s:e])
            reranked = []
            for entry in rankings[:limit]:
                idx = entry.get("index", 0)
                if 0 <= idx < len(rerank_pool):
                    reranked.append(rerank_pool[idx])

            return reranked if reranked else pool[:limit]

        except Exception as e:
            logger.error(f"Claude re-rank failed: [{type(e).__name__}] {e}")
            return pool[:limit]
