"""Tests for DeezerMusicSource"""
import pytest
from unittest.mock import patch, MagicMock
from music_sources.deezer import DeezerMusicSource


@pytest.fixture
def deezer_source():
    return DeezerMusicSource()


def _mock_search_result(title="Test Song", artist="Test Artist", bpm=150, duration=210):
    """Create a mock Deezer search result."""
    return {
        "id": 12345,
        "title": title,
        "artist": {"name": artist},
        "duration": duration,
        "rank": 500000,
        "preview": "https://preview.example.com/test.mp3",
        "album": {"cover_medium": "https://cover.example.com/test.jpg"},
    }


def _mock_track_detail(track_id=12345, bpm=150.0):
    """Create a mock Deezer track detail."""
    return {"id": track_id, "bpm": bpm}


class TestDeezerMusicSource:
    def test_name(self, deezer_source):
        assert deezer_source.name == "deezer"

    @patch("music_sources.deezer.requests.get")
    def test_search_by_bpm_returns_candidates(self, mock_get, deezer_source):
        search_resp = MagicMock()
        search_resp.status_code = 200
        search_resp.json.return_value = {
            "data": [_mock_search_result("Song A", "Artist A", duration=200)]
        }

        detail_resp = MagicMock()
        detail_resp.status_code = 200
        detail_resp.json.return_value = _mock_track_detail(bpm=155.0)

        mock_get.side_effect = [search_resp, detail_resp]

        candidates = deezer_source.search_by_bpm(140, 160, genre="rock", limit=5)

        assert len(candidates) >= 1
        assert candidates[0].name == "Song A"
        assert candidates[0].artist == "Artist A"
        assert candidates[0].source == "deezer"
        assert candidates[0].verified_bpm is True

    @patch("music_sources.deezer.requests.get")
    def test_search_by_bpm_skips_zero_bpm(self, mock_get, deezer_source):
        search_resp = MagicMock()
        search_resp.status_code = 200
        search_resp.json.return_value = {
            "data": [_mock_search_result("Song B", "Artist B")]
        }

        detail_resp = MagicMock()
        detail_resp.status_code = 200
        detail_resp.json.return_value = _mock_track_detail(bpm=0.0)

        mock_get.side_effect = [search_resp, detail_resp]

        candidates = deezer_source.search_by_bpm(140, 160, genre="rock", limit=5)
        assert len(candidates) == 0

    @patch("music_sources.deezer.requests.get")
    def test_search_handles_api_error(self, mock_get, deezer_source):
        mock_get.side_effect = Exception("Network error")
        candidates = deezer_source.search_by_bpm(140, 160, genre="rock", limit=5)
        assert candidates == []
