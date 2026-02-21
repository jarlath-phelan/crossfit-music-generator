"""
Tests for PlaylistComposerAgent
"""
import pytest
from agents.music_curator import MusicCuratorAgent
from agents.playlist_composer import PlaylistComposerAgent


@pytest.fixture
def curator():
    return MusicCuratorAgent()


@pytest.fixture
def composer(curator):
    return PlaylistComposerAgent(curator=curator)


class TestPlaylistCompose:
    def test_compose_creates_playlist(self, composer, sample_workout):
        playlist = composer.compose(sample_workout)
        assert playlist is not None
        assert len(playlist.tracks) > 0

    def test_compose_names_playlist(self, composer, sample_workout):
        playlist = composer.compose(sample_workout)
        assert sample_workout.workout_name in playlist.name

    def test_compose_fills_all_phases(self, composer, sample_workout):
        playlist = composer.compose(sample_workout)
        # Should have at least one track per phase
        assert len(playlist.tracks) >= len(sample_workout.phases)


class TestPlaylistValidation:
    def test_valid_playlist_passes(self, composer, sample_workout):
        playlist = composer.compose(sample_workout)
        is_valid, error = composer.validate_playlist(playlist, sample_workout)
        assert is_valid, f"Validation failed: {error}"

    def test_empty_playlist_fails(self, composer, sample_workout):
        from models.schemas import Playlist

        # Pydantic min_length=1 will reject empty tracks list
        with pytest.raises(Exception):
            Playlist(name="Empty", tracks=[])


class TestPlaylistFullPipeline:
    def test_compose_and_validate(self, composer, sample_workout):
        playlist = composer.compose_and_validate(sample_workout)
        assert playlist is not None
        assert len(playlist.tracks) > 0

    def test_full_pipeline_from_text(self):
        """Integration test: text → parse → compose → validate"""
        from agents.workout_parser import WorkoutParserAgent

        parser = WorkoutParserAgent()
        curator = MusicCuratorAgent()
        composer = PlaylistComposerAgent(curator=curator)

        workout = parser.parse_and_validate(
            "AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats"
        )
        playlist = composer.compose_and_validate(workout)

        assert playlist is not None
        assert len(playlist.tracks) > 0
        assert "AMRAP" in playlist.name
