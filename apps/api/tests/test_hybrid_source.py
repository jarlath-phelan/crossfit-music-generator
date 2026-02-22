"""Tests for HybridMusicSource"""
import pytest
from unittest.mock import MagicMock
from music_sources.hybrid import HybridMusicSource
from music_sources.base import TrackCandidate


@pytest.fixture
def mock_deezer():
    source = MagicMock()
    source.search_by_bpm.return_value = [
        TrackCandidate(name="Deezer Track", artist="Deezer Artist", bpm=150,
                       energy=0.8, duration_ms=200000, source="deezer", verified_bpm=True),
    ]
    return source


@pytest.fixture
def mock_claude():
    source = MagicMock()
    source.search_by_bpm.return_value = [
        TrackCandidate(name="Claude Track", artist="Claude Artist", bpm=155,
                       energy=0.85, duration_ms=210000, source="claude", verified_bpm=False),
    ]
    return source


class TestHybridSource:
    def test_uses_deezer_when_enough_results(self, mock_deezer, mock_claude):
        source = HybridMusicSource(deezer=mock_deezer, claude=mock_claude)
        candidates = source.search_by_bpm(140, 160, genre="rock", limit=1)
        assert len(candidates) >= 1
        assert candidates[0].source == "deezer"
        mock_claude.search_by_bpm.assert_not_called()

    def test_falls_back_to_claude_when_deezer_insufficient(self, mock_deezer, mock_claude):
        mock_deezer.search_by_bpm.return_value = []
        source = HybridMusicSource(deezer=mock_deezer, claude=mock_claude)
        candidates = source.search_by_bpm(140, 160, genre="rock", limit=5)
        assert len(candidates) >= 1
        assert candidates[0].source == "claude"

    def test_name(self, mock_deezer, mock_claude):
        source = HybridMusicSource(deezer=mock_deezer, claude=mock_claude)
        assert source.name == "hybrid"
