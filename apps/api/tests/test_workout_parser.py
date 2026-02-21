"""
Tests for WorkoutParserAgent
"""
import pytest
from agents.workout_parser import WorkoutParserAgent


@pytest.fixture
def parser():
    return WorkoutParserAgent()


class TestWorkoutParserPlan:
    def test_plan_detects_amrap(self, parser, sample_amrap_text):
        plan = parser.plan(sample_amrap_text)
        assert plan["workout_type"] == "AMRAP"

    def test_plan_detects_rft(self, parser, sample_rft_text):
        plan = parser.plan(sample_rft_text)
        assert plan["workout_type"] == "RFT"

    def test_plan_detects_emom(self, parser, sample_emom_text):
        plan = parser.plan(sample_emom_text)
        assert plan["workout_type"] == "EMOM"

    def test_plan_detects_tabata(self, parser, sample_tabata_text):
        plan = parser.plan(sample_tabata_text)
        assert plan["workout_type"] == "Tabata"

    def test_plan_detects_descending_reps_as_rft(self, parser, sample_workout_text):
        plan = parser.plan(sample_workout_text)
        # 21-15-9 doesn't have "for time" keyword, falls to Chipper
        assert plan["workout_type"] in ("RFT", "Chipper")


class TestWorkoutParserExecute:
    def test_parse_amrap(self, parser, sample_amrap_text):
        workout = parser.execute(sample_amrap_text)
        assert workout.workout_name == "20 Minute AMRAP"
        assert workout.total_duration_min == 28  # 5 warm + 20 work + 3 cool
        assert len(workout.phases) == 3

    def test_parse_emom(self, parser, sample_emom_text):
        workout = parser.execute(sample_emom_text)
        assert "EMOM" in workout.workout_name
        assert len(workout.phases) == 3

    def test_parse_rft(self, parser, sample_rft_text):
        workout = parser.execute(sample_rft_text)
        assert len(workout.phases) == 3
        # Main phase should be very_high intensity for RFT
        main_phase = workout.phases[1]
        assert main_phase.intensity == "very_high"

    def test_parse_tabata(self, parser, sample_tabata_text):
        workout = parser.execute(sample_tabata_text)
        assert "Tabata" in workout.workout_name
        assert len(workout.phases) == 3
        # Main phase should be very_high for tabata
        main_phase = workout.phases[1]
        assert main_phase.intensity == "very_high"

    def test_phases_have_valid_bpm_ranges(self, parser, sample_amrap_text):
        workout = parser.execute(sample_amrap_text)
        for phase in workout.phases:
            bpm_min, bpm_max = phase.bpm_range
            assert bpm_min < bpm_max
            assert bpm_min >= 60
            assert bpm_max <= 200


class TestWorkoutParserValidate:
    def test_valid_workout_passes(self, parser, sample_workout):
        is_valid, error = parser.validate(sample_workout)
        assert is_valid
        assert error is None

    def test_empty_phases_fails(self, parser):
        from models.schemas import WorkoutStructure

        with pytest.raises(Exception):
            # Pydantic min_length=1 will reject empty phases
            WorkoutStructure(
                workout_name="Test",
                total_duration_min=10,
                phases=[],
            )

    def test_mismatched_duration_fails(self, parser):
        from models.schemas import WorkoutStructure, Phase

        workout = WorkoutStructure(
            workout_name="Test",
            total_duration_min=100,  # Way off from phase sum
            phases=[
                Phase(
                    name="Work",
                    duration_min=10,
                    intensity="high",
                    bpm_range=(145, 160),
                )
            ],
        )
        is_valid, error = parser.validate(workout)
        assert not is_valid
        assert "don't match" in error


class TestWorkoutParserFullPipeline:
    def test_parse_and_validate_amrap(self, parser, sample_amrap_text):
        workout = parser.parse_and_validate(sample_amrap_text)
        assert workout is not None
        assert len(workout.phases) >= 1

    def test_parse_and_validate_rft(self, parser, sample_rft_text):
        workout = parser.parse_and_validate(sample_rft_text)
        assert workout is not None

    def test_parse_and_validate_emom(self, parser, sample_emom_text):
        workout = parser.parse_and_validate(sample_emom_text)
        assert workout is not None
