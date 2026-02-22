"""
Tests for feedback-influenced scoring in MusicCuratorAgent
"""
import pytest
from agents.music_curator import MusicCuratorAgent
from models.schemas import Phase, Track


@pytest.fixture
def curator():
    return MusicCuratorAgent()


@pytest.fixture
def high_phase():
    return Phase(
        name="Main WOD",
        duration_min=12,
        intensity="high",
        bpm_range=(145, 160),
    )


class TestBoostArtists:
    def test_boosted_artist_scores_higher(self, curator, high_phase):
        """Tracks by boosted artists should score higher."""
        tracks = curator.search_tracks(high_phase)
        if not tracks:
            pytest.skip("No tracks found for this phase")

        target_artist = tracks[0].artist

        scored_normal = curator.score_candidates(tracks, high_phase, set())
        scored_boosted = curator.score_candidates(
            tracks, high_phase, set(), boost_artists={target_artist}
        )

        normal_score = next(s for t, s in scored_normal if t.artist == target_artist)
        boosted_score = next(s for t, s in scored_boosted if t.artist == target_artist)

        assert boosted_score == normal_score + 15

    def test_boost_empty_set_no_effect(self, curator, high_phase):
        """An empty boost set should not change scores."""
        tracks = curator.search_tracks(high_phase)
        if not tracks:
            pytest.skip("No tracks found")

        scored_normal = curator.score_candidates(tracks, high_phase, set())
        scored_boosted = curator.score_candidates(
            tracks, high_phase, set(), boost_artists=set()
        )

        for (t1, s1), (t2, s2) in zip(scored_normal, scored_boosted):
            assert s1 == s2


class TestHiddenTracks:
    def test_hidden_tracks_filtered_out(self, curator, high_phase):
        """Tracks in the hidden set should be excluded from results."""
        tracks = curator.search_tracks(high_phase)
        if not tracks:
            pytest.skip("No tracks found")

        hidden_id = tracks[0].id

        scored = curator.score_candidates(
            tracks, high_phase, set(), hidden_tracks={hidden_id}
        )

        result_ids = {t.id for t, _ in scored}
        assert hidden_id not in result_ids

    def test_hidden_tracks_none_no_effect(self, curator, high_phase):
        """None hidden_tracks should not filter anything."""
        tracks = curator.search_tracks(high_phase)
        if not tracks:
            pytest.skip("No tracks found")

        scored_normal = curator.score_candidates(tracks, high_phase, set())
        scored_none = curator.score_candidates(
            tracks, high_phase, set(), hidden_tracks=None
        )

        assert len(scored_normal) == len(scored_none)

    def test_all_tracks_hidden_returns_empty(self, curator, high_phase):
        """If all tracks are hidden, scored list should be empty."""
        tracks = curator.search_tracks(high_phase)
        if not tracks:
            pytest.skip("No tracks found")

        all_ids = {t.id for t in tracks}
        scored = curator.score_candidates(
            tracks, high_phase, set(), hidden_tracks=all_ids
        )

        assert len(scored) == 0
