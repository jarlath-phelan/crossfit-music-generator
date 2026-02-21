"""
Shared test fixtures for CrossFit Playlist Generator API tests
"""
import sys
import os
import pytest

# Add the api directory to the path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Force mock mode for all tests
os.environ["USE_MOCK_ANTHROPIC"] = "true"
os.environ["USE_MOCK_SPOTIFY"] = "true"

from models.schemas import Phase, WorkoutStructure, Track


@pytest.fixture
def sample_workout_text():
    """Standard workout text for testing"""
    return "21-15-9 thrusters 95lbs and pull-ups"


@pytest.fixture
def sample_amrap_text():
    """AMRAP workout text"""
    return "AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats"


@pytest.fixture
def sample_emom_text():
    """EMOM workout text"""
    return "EMOM 12 minutes: 10 burpees"


@pytest.fixture
def sample_tabata_text():
    """Tabata workout text"""
    return "Tabata: push-ups, air squats, sit-ups, burpees"


@pytest.fixture
def sample_rft_text():
    """Rounds For Time workout text"""
    return "5 rounds for time: 400m run, 15 overhead squats, 15 pull-ups"


@pytest.fixture
def sample_phase():
    """A single workout phase"""
    return Phase(
        name="Main WOD",
        duration_min=12,
        intensity="very_high",
        bpm_range=(160, 175),
    )


@pytest.fixture
def sample_warmup_phase():
    """A warm-up phase"""
    return Phase(
        name="Warm-up",
        duration_min=5,
        intensity="warm_up",
        bpm_range=(100, 120),
    )


@pytest.fixture
def sample_cooldown_phase():
    """A cooldown phase"""
    return Phase(
        name="Cooldown",
        duration_min=3,
        intensity="cooldown",
        bpm_range=(80, 100),
    )


@pytest.fixture
def sample_workout():
    """A complete parsed workout structure"""
    return WorkoutStructure(
        workout_name="21-15-9",
        total_duration_min=20,
        phases=[
            Phase(
                name="Warm-up",
                duration_min=5,
                intensity="warm_up",
                bpm_range=(100, 120),
            ),
            Phase(
                name="Main WOD",
                duration_min=12,
                intensity="very_high",
                bpm_range=(160, 175),
            ),
            Phase(
                name="Cooldown",
                duration_min=3,
                intensity="cooldown",
                bpm_range=(80, 100),
            ),
        ],
    )


@pytest.fixture
def sample_track():
    """A single track"""
    return Track(
        id="test-1",
        name="Mr. Brightside",
        artist="The Killers",
        bpm=148,
        energy=0.89,
        duration_ms=223000,
    )
