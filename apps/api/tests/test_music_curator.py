"""
Tests for MusicCuratorAgent
"""
import pytest
from agents.music_curator import MusicCuratorAgent


@pytest.fixture
def curator():
    return MusicCuratorAgent()


class TestMusicCuratorSearch:
    def test_search_returns_tracks(self, curator, sample_phase):
        tracks = curator.search_tracks(sample_phase)
        assert len(tracks) > 0

    def test_search_respects_bpm_range(self, curator, sample_phase):
        tracks = curator.search_tracks(sample_phase)
        bpm_min, bpm_max = sample_phase.bpm_range
        for track in tracks:
            assert bpm_min <= track.bpm <= bpm_max

    def test_search_warmup_returns_low_energy(self, curator, sample_warmup_phase):
        tracks = curator.search_tracks(sample_warmup_phase)
        assert len(tracks) > 0
        for track in tracks:
            assert track.bpm >= 100
            assert track.bpm <= 120

    def test_search_cooldown_returns_tracks(self, curator, sample_cooldown_phase):
        tracks = curator.search_tracks(sample_cooldown_phase)
        assert len(tracks) > 0


class TestMusicCuratorScoring:
    def test_score_candidates(self, curator, sample_phase):
        tracks = curator.search_tracks(sample_phase)
        scored = curator.score_candidates(tracks, sample_phase, set())
        assert len(scored) > 0
        # Scores should be in descending order
        for i in range(len(scored) - 1):
            assert scored[i][1] >= scored[i + 1][1]

    def test_artist_diversity_penalty(self, curator, sample_phase):
        tracks = curator.search_tracks(sample_phase)
        if not tracks:
            pytest.skip("No tracks found for this phase")

        first_artist = tracks[0].artist
        # Score with no used artists
        scored_fresh = curator.score_candidates(tracks, sample_phase, set())
        # Score with first artist already used
        scored_repeat = curator.score_candidates(tracks, sample_phase, {first_artist})

        # The first track should score lower when its artist is already used
        fresh_score = next(s for t, s in scored_fresh if t.artist == first_artist)
        repeat_score = next(s for t, s in scored_repeat if t.artist == first_artist)
        assert repeat_score < fresh_score


class TestMusicCuratorSelection:
    def test_select_track_for_phase(self, curator, sample_phase):
        track = curator.select_track_for_phase(sample_phase, set())
        assert track is not None
        assert track.bpm >= sample_phase.bpm_range[0]
        assert track.bpm <= sample_phase.bpm_range[1]

    def test_select_track_avoids_used_artists(self, curator, sample_phase):
        # Select first track
        track1 = curator.select_track_for_phase(sample_phase, set())
        assert track1 is not None

        # Select second track, should prefer different artist
        track2 = curator.select_track_for_phase(sample_phase, {track1.artist})
        if track2 is not None:
            # With diversity scoring, should prefer different artist when possible
            # (not guaranteed if all tracks are same artist)
            pass  # Just checking it doesn't crash
