"""Tests for TwoStepClaudeMusicSource"""
import pytest
from unittest.mock import MagicMock, patch
from music_sources.claude_two_step import TwoStepClaudeMusicSource
from music_sources.base import TrackCandidate


class TestTwoStepClaude:
    @patch("music_sources.claude_two_step.random.shuffle", lambda x: None)
    @patch("music_sources.claude_two_step.settings")
    @patch("music_sources.claude_two_step.anthropic")
    def test_generates_then_reranks(self, mock_anthropic, mock_settings):
        client = MagicMock()
        mock_anthropic.Anthropic.return_value = client

        gen_response = MagicMock()
        gen_response.content = [MagicMock()]
        gen_response.content[0].text = '''[
            {"title": "Song A", "artist": "Artist A", "bpm": 155, "energy": 0.85, "duration_sec": 200},
            {"title": "Song B", "artist": "Artist B", "bpm": 150, "energy": 0.9, "duration_sec": 210},
            {"title": "Song C", "artist": "Artist C", "bpm": 145, "energy": 0.8, "duration_sec": 190}
        ]'''
        gen_response.usage = MagicMock(input_tokens=100, output_tokens=200)

        rank_response = MagicMock()
        rank_response.content = [MagicMock()]
        rank_response.content[0].text = '[{"index": 1, "reason": "best energy"}, {"index": 0, "reason": "good fit"}]'
        rank_response.usage = MagicMock(input_tokens=100, output_tokens=100)

        client.messages.create.side_effect = [gen_response, rank_response]

        source = TwoStepClaudeMusicSource()
        candidates = source.search_by_bpm(140, 160, genre="rock", limit=2)

        assert len(candidates) == 2
        assert candidates[0].name == "Song B"
        assert candidates[1].name == "Song A"
        assert client.messages.create.call_count == 2
