"""Tests for ArtistExpansionService"""
import pytest
from unittest.mock import MagicMock, patch
from services.artist_expansion import ArtistExpansionService


class TestArtistExpansion:
    def test_lastfm_strategy(self):
        mock_lastfm = MagicMock()
        mock_lastfm.get_similar_artists.return_value = ["Rise Against", "Bad Religion"]

        service = ArtistExpansionService(strategy="lastfm", lastfm_client=mock_lastfm)
        expanded = service.expand(["Foo Fighters"])

        assert "Rise Against" in expanded
        assert "Bad Religion" in expanded

    @patch("services.artist_expansion.anthropic")
    def test_claude_strategy(self, mock_anthropic):
        client = MagicMock()
        mock_anthropic.Anthropic.return_value = client
        resp = MagicMock()
        resp.content = [MagicMock()]
        resp.content[0].text = '["Rise Against", "Bad Religion", "Pennywise"]'
        resp.usage = MagicMock(input_tokens=50, output_tokens=30)
        client.messages.create.return_value = resp

        service = ArtistExpansionService(strategy="claude")
        expanded = service.expand(["Foo Fighters"])

        assert "Rise Against" in expanded

    def test_hybrid_strategy_uses_lastfm_first(self):
        mock_lastfm = MagicMock()
        mock_lastfm.get_similar_artists.return_value = ["Rise Against"]

        service = ArtistExpansionService(strategy="hybrid", lastfm_client=mock_lastfm)
        expanded = service.expand(["Foo Fighters"])

        assert "Rise Against" in expanded
