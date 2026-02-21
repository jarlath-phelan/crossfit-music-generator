"""
Tests for the real Anthropic client.
These tests verify the client code structure without making real API calls.
"""
import pytest
from unittest.mock import MagicMock, patch


class TestAnthropicClientStructure:
    """Test that the client code is importable and structured correctly."""

    def test_import_client(self):
        from clients.anthropic_client import AnthropicClient
        assert AnthropicClient is not None

    def test_import_constants(self):
        from clients.anthropic_client import BPM_MAPPING, WORKOUT_TOOL, SYSTEM_PROMPT
        assert "warm_up" in BPM_MAPPING
        assert BPM_MAPPING["warm_up"] == (100, 120)
        assert BPM_MAPPING["very_high"] == (160, 175)
        assert WORKOUT_TOOL["name"] == "parse_workout"
        assert len(SYSTEM_PROMPT) > 100

    def test_tool_schema_has_required_fields(self):
        from clients.anthropic_client import WORKOUT_TOOL
        schema = WORKOUT_TOOL["input_schema"]
        assert "workout_name" in schema["properties"]
        assert "total_duration_min" in schema["properties"]
        assert "phases" in schema["properties"]
        assert schema["required"] == ["workout_name", "total_duration_min", "phases"]

    def test_phase_schema_has_intensity_enum(self):
        from clients.anthropic_client import WORKOUT_TOOL
        phase_props = WORKOUT_TOOL["input_schema"]["properties"]["phases"]["items"]["properties"]
        assert phase_props["intensity"]["enum"] == [
            "warm_up", "low", "moderate", "high", "very_high", "cooldown"
        ]


class TestAnthropicClientParsing:
    """Test the response extraction logic with mocked API responses."""

    def test_extract_workout_from_tool_use(self):
        from clients.anthropic_client import AnthropicClient

        # Create a mock response mimicking Claude's tool_use response
        mock_block = MagicMock()
        mock_block.type = "tool_use"
        mock_block.name = "parse_workout"
        mock_block.input = {
            "workout_name": "20 Minute AMRAP",
            "total_duration_min": 28,
            "phases": [
                {"name": "Warm-up", "duration_min": 5, "intensity": "warm_up", "bpm_range": [100, 120]},
                {"name": "AMRAP Work", "duration_min": 20, "intensity": "high", "bpm_range": [145, 160]},
                {"name": "Cooldown", "duration_min": 3, "intensity": "cooldown", "bpm_range": [80, 100]},
            ],
        }

        mock_response = MagicMock()
        mock_response.content = [mock_block]

        # Test extraction without actually calling API
        with patch("anthropic.Anthropic"):
            client = AnthropicClient(api_key="test-key")

        workout = client._extract_workout(mock_response)

        assert workout.workout_name == "20 Minute AMRAP"
        assert workout.total_duration_min == 28
        assert len(workout.phases) == 3
        assert workout.phases[0].intensity == "warm_up"
        assert workout.phases[1].intensity == "high"
        assert workout.phases[1].bpm_range == (145, 160)

    def test_extract_workout_no_tool_use_raises(self):
        from clients.anthropic_client import AnthropicClient

        mock_block = MagicMock()
        mock_block.type = "text"

        mock_response = MagicMock()
        mock_response.content = [mock_block]

        with patch("anthropic.Anthropic"):
            client = AnthropicClient(api_key="test-key")

        with pytest.raises(ValueError, match="did not return"):
            client._extract_workout(mock_response)


class TestMusicSourceArchitecture:
    """Test the pluggable music source architecture."""

    def test_mock_source_implements_interface(self):
        from music_sources.mock_source import MockMusicSource
        from music_sources.base import MusicSource

        source = MockMusicSource()
        assert isinstance(source, MusicSource)
        assert source.name == "mock"

    def test_mock_source_search(self):
        from music_sources.mock_source import MockMusicSource

        source = MockMusicSource()
        results = source.search_by_bpm(145, 160, genre="rock", limit=5)
        assert len(results) > 0
        for r in results:
            assert r.bpm >= 145
            assert r.bpm <= 160

    def test_create_music_source_default(self):
        from agents.music_curator import create_music_source

        source = create_music_source()
        assert source.name == "mock"

    def test_curator_with_mock_source(self):
        from agents.music_curator import MusicCuratorAgent
        from music_sources.mock_source import MockMusicSource

        source = MockMusicSource()
        curator = MusicCuratorAgent(music_source=source)
        assert curator.source.name == "mock"
