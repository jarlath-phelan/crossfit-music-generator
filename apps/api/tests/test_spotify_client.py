"""
Tests for the Spotify client.
Tests verify client code structure without making real API calls.
"""
import pytest
from unittest.mock import MagicMock, patch


class TestSpotifyClientStructure:
    """Test that the Spotify client is importable and structured correctly."""

    def test_import_client(self):
        from clients.spotify_client import SpotifyClient
        assert SpotifyClient is not None

    def test_import_spotify_track(self):
        from clients.spotify_client import SpotifyTrack
        track = SpotifyTrack(
            spotify_uri="spotify:track:abc123",
            spotify_url="https://open.spotify.com/track/abc123",
            name="Test Song",
            artist="Test Artist",
            album_art_url="https://example.com/art.jpg",
            duration_ms=210000,
        )
        assert track.spotify_uri == "spotify:track:abc123"
        assert track.duration_ms == 210000


class TestSpotifyClientSearch:
    """Test search logic with mocked spotipy responses."""

    def _make_client(self):
        from clients.spotify_client import SpotifyClient
        with patch("clients.spotify_client.spotipy.Spotify") as mock_sp, \
             patch("clients.spotify_client.SpotifyClientCredentials"):
            client = SpotifyClient(
                client_id="test-id",
                client_secret="test-secret",
            )
            # Store a reference so sp.search can be mocked after construction
            client.sp = mock_sp.return_value
        return client

    def test_search_track_found(self):
        client = self._make_client()
        client.sp.search = MagicMock(return_value={
            "tracks": {
                "items": [
                    {
                        "uri": "spotify:track:abc123",
                        "name": "Mr. Brightside",
                        "external_urls": {"spotify": "https://open.spotify.com/track/abc123"},
                        "artists": [{"name": "The Killers"}],
                        "album": {
                            "images": [
                                {"url": "https://example.com/art300.jpg", "width": 300, "height": 300},
                                {"url": "https://example.com/art640.jpg", "width": 640, "height": 640},
                            ]
                        },
                        "duration_ms": 223000,
                    }
                ]
            }
        })

        result = client.search_track("Mr. Brightside", "The Killers")
        assert result is not None
        assert result.spotify_uri == "spotify:track:abc123"
        assert result.name == "Mr. Brightside"
        assert result.album_art_url == "https://example.com/art300.jpg"
        assert result.duration_ms == 223000

    def test_search_track_not_found(self):
        client = self._make_client()
        client.sp.search = MagicMock(return_value={
            "tracks": {"items": []}
        })

        result = client.search_track("Nonexistent Song", "Nobody")
        assert result is None

    def test_resolve_tracks(self):
        client = self._make_client()
        client.sp.search = MagicMock(return_value={
            "tracks": {
                "items": [
                    {
                        "uri": "spotify:track:abc123",
                        "name": "Test",
                        "external_urls": {"spotify": "https://open.spotify.com/track/abc123"},
                        "artists": [{"name": "Artist"}],
                        "album": {"images": [{"url": "https://example.com/art.jpg", "width": 300, "height": 300}]},
                        "duration_ms": 200000,
                    }
                ]
            }
        })

        tracks = [{"name": "Test", "artist": "Artist"}]
        resolved = client.resolve_tracks(tracks)

        assert len(resolved) == 1
        assert resolved[0]["spotify_uri"] == "spotify:track:abc123"
        assert resolved[0]["album_art_url"] == "https://example.com/art.jpg"


class TestPipelineIntegration:
    """Test that the pipeline works with and without Spotify."""

    def test_generate_without_spotify(self):
        """Pipeline should work fine without Spotify client."""
        import main as main_module
        from agents.workout_parser import WorkoutParserAgent
        from agents.music_curator import MusicCuratorAgent
        from agents.playlist_composer import PlaylistComposerAgent

        main_module.workout_parser = WorkoutParserAgent()
        main_module.music_curator = MusicCuratorAgent()
        main_module.playlist_composer = PlaylistComposerAgent(
            curator=main_module.music_curator
        )
        main_module.spotify_client = None  # No Spotify

        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/api/v1/generate",
            json={"workout_text": "AMRAP 20 minutes: 5 pull-ups, 10 push-ups"},
        )
        assert response.status_code == 200
        data = response.json()
        # Tracks should not have spotify_uri when Spotify is disabled
        for track in data["playlist"]["tracks"]:
            assert track.get("spotify_uri") is None
