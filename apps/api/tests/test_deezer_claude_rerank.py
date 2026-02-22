"""Tests for DeezerClaudeRerankSource"""
import pytest
from unittest.mock import MagicMock, patch
from music_sources.deezer_claude_rerank import DeezerClaudeRerankSource
from music_sources.base import TrackCandidate


@pytest.fixture
def mock_deezer():
    source = MagicMock()
    source.search_by_bpm.return_value = [
        TrackCandidate(name=f"Track {i}", artist=f"Artist {i}", bpm=150 + i,
                       energy=0.8, duration_ms=200000, source="deezer", verified_bpm=True)
        for i in range(10)
    ]
    return source


class TestDeezerClaudeRerank:
    @patch("music_sources.deezer_claude_rerank.settings")
    @patch("music_sources.deezer_claude_rerank.anthropic")
    def test_deezer_candidates_reranked_by_claude(self, mock_anthropic, mock_settings, mock_deezer):
        client = MagicMock()
        mock_anthropic.Anthropic.return_value = client

        rank_response = MagicMock()
        rank_response.content = [MagicMock()]
        rank_response.content[0].text = '[{"index": 3}, {"index": 1}, {"index": 5}]'
        rank_response.usage = MagicMock(input_tokens=100, output_tokens=100)
        client.messages.create.return_value = rank_response

        source = DeezerClaudeRerankSource(deezer=mock_deezer)
        candidates = source.search_by_bpm(140, 160, genre="rock", limit=3)

        assert len(candidates) == 3
        assert all(c.verified_bpm for c in candidates)

    @patch("music_sources.deezer_claude_rerank.settings")
    @patch("music_sources.deezer_claude_rerank.anthropic")
    def test_falls_back_to_deezer_order_on_rerank_failure(self, mock_anthropic, mock_settings, mock_deezer):
        client = MagicMock()
        mock_anthropic.Anthropic.return_value = client
        client.messages.create.side_effect = Exception("API error")

        source = DeezerClaudeRerankSource(deezer=mock_deezer)
        candidates = source.search_by_bpm(140, 160, genre="rock", limit=3)

        assert len(candidates) == 3
        assert candidates[0].name == "Track 0"
