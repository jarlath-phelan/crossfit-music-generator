"""Tests for Last.fm client"""
import pytest
from unittest.mock import patch, MagicMock
from clients.lastfm_client import LastFmClient


class TestLastFmClient:
    @patch("clients.lastfm_client.requests.get")
    def test_get_similar_artists(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "similarartists": {
                    "artist": [
                        {"name": "Rise Against", "match": "0.85"},
                        {"name": "Bad Religion", "match": "0.72"},
                    ]
                }
            }
        )

        client = LastFmClient(api_key="test-key")
        similar = client.get_similar_artists("Foo Fighters", limit=5)

        assert len(similar) == 2
        assert similar[0] == "Rise Against"
        assert similar[1] == "Bad Religion"

    @patch("clients.lastfm_client.requests.get")
    def test_handles_api_error(self, mock_get):
        mock_get.side_effect = Exception("Network error")
        client = LastFmClient(api_key="test-key")
        similar = client.get_similar_artists("Foo Fighters")
        assert similar == []
