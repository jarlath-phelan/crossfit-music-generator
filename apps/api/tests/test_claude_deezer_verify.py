"""Tests for ClaudeDeezerVerifySource"""
import pytest
from unittest.mock import MagicMock, patch
from music_sources.claude_deezer_verify import ClaudeDeezerVerifySource
from music_sources.base import TrackCandidate


@pytest.fixture
def mock_claude_source():
    source = MagicMock()
    source.search_by_bpm.return_value = [
        TrackCandidate(name="Enter Sandman", artist="Metallica", bpm=168,
                       energy=0.88, duration_ms=331000, source="claude", verified_bpm=False),
    ]
    source.batch_search.return_value = {
        "Main WOD": [
            TrackCandidate(name="Enter Sandman", artist="Metallica", bpm=168,
                           energy=0.88, duration_ms=331000, source="claude", verified_bpm=False),
        ]
    }
    return source


class TestClaudeDeezerVerify:
    @patch("music_sources.claude_deezer_verify.requests.get")
    def test_verifies_track_with_deezer(self, mock_get, mock_claude_source):
        search_resp = MagicMock()
        search_resp.status_code = 200
        search_resp.json.return_value = {
            "data": [{"id": 99, "title": "Enter Sandman", "artist": {"name": "Metallica"}}]
        }

        detail_resp = MagicMock()
        detail_resp.status_code = 200
        detail_resp.json.return_value = {"id": 99, "bpm": 170.0}

        mock_get.side_effect = [search_resp, detail_resp]

        source = ClaudeDeezerVerifySource(claude_source=mock_claude_source)
        candidates = source.search_by_bpm(160, 175, genre="metal", limit=5)

        assert len(candidates) == 1
        assert candidates[0].verified_bpm is True
        assert candidates[0].bpm == 170

    @patch("music_sources.claude_deezer_verify.requests.get")
    def test_keeps_claude_bpm_when_deezer_returns_zero(self, mock_get, mock_claude_source):
        search_resp = MagicMock()
        search_resp.status_code = 200
        search_resp.json.return_value = {
            "data": [{"id": 99, "title": "Enter Sandman", "artist": {"name": "Metallica"}}]
        }

        detail_resp = MagicMock()
        detail_resp.status_code = 200
        detail_resp.json.return_value = {"id": 99, "bpm": 0.0}

        mock_get.side_effect = [search_resp, detail_resp]

        source = ClaudeDeezerVerifySource(claude_source=mock_claude_source)
        candidates = source.search_by_bpm(160, 175, genre="metal", limit=5)

        assert len(candidates) == 1
        assert candidates[0].verified_bpm is False
        assert candidates[0].bpm == 168  # Claude BPM kept
