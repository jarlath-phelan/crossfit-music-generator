"""
Integration tests for the FastAPI application
"""
import pytest
from fastapi.testclient import TestClient

import main as main_module
from main import app
from agents.workout_parser import WorkoutParserAgent
from agents.music_curator import MusicCuratorAgent
from agents.playlist_composer import PlaylistComposerAgent


@pytest.fixture(autouse=True)
def setup_agents():
    """Initialize agents before each test (simulates lifespan)"""
    main_module.workout_parser = WorkoutParserAgent()
    main_module.music_curator = MusicCuratorAgent()
    main_module.playlist_composer = PlaylistComposerAgent(
        curator=main_module.music_curator
    )


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


class TestRootEndpoint:
    def test_root_returns_api_info(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Crank API"
        assert "version" in data
        # Operational config should NOT be exposed
        assert "mock_mode" not in data
        assert "music_source" not in data


class TestHealthEndpoint:
    def test_health_returns_status(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "agents" in data
        # Internal config (mock_mode, music_source) should NOT be exposed
        assert "music_source" not in data
        assert "mock_mode" not in data


class TestGenerateEndpoint:
    def test_generate_with_text(self, client):
        response = client.post(
            "/api/v1/generate",
            json={"workout_text": "AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "workout" in data
        assert "playlist" in data
        assert len(data["playlist"]["tracks"]) > 0

    def test_generate_with_rft(self, client):
        response = client.post(
            "/api/v1/generate",
            json={"workout_text": "5 rounds for time: 400m run, 15 overhead squats"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["playlist"]["tracks"]) > 0

    def test_generate_no_input_fails(self, client):
        response = client.post(
            "/api/v1/generate",
            json={},
        )
        assert response.status_code == 400

    def test_generate_short_text_fails(self, client):
        response = client.post(
            "/api/v1/generate",
            json={"workout_text": "hi"},
        )
        assert response.status_code == 422

    def test_generate_missing_body_fails(self, client):
        response = client.post("/api/v1/generate")
        assert response.status_code == 422

    def test_generate_image_without_media_type_fails(self, client):
        """Image input requires both base64 data and media type"""
        response = client.post(
            "/api/v1/generate",
            json={"workout_image_base64": "abc123"},
        )
        assert response.status_code == 400

    def test_generate_image_in_mock_mode_fails(self, client):
        """Image parsing not available in mock mode"""
        response = client.post(
            "/api/v1/generate",
            json={
                "workout_image_base64": "abc123",
                "image_media_type": "image/jpeg",
            },
        )
        assert response.status_code == 400
        assert "mock" in response.json()["detail"].lower() or "not" in response.json()["detail"].lower()
