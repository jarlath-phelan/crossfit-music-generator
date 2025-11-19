"""
WorkoutParserAgent: Parses CrossFit workout text into structured format
"""
import logging
from typing import Optional
from models.schemas import WorkoutStructure
from mocks.anthropic_mock import MockAnthropicClient
from config import settings

logger = logging.getLogger(__name__)


class WorkoutParserAgent:
    """
    Agent responsible for parsing workout text into structured phases.
    
    Uses Claude API (or mock implementation) to understand workout format
    and extract phases with intensity levels and BPM requirements.
    """
    
    def __init__(self):
        """Initialize the agent with appropriate Claude client"""
        if settings.use_mock_anthropic:
            logger.info("Using mock Anthropic client")
            self.client = MockAnthropicClient()
        else:
            # Future: Initialize real Anthropic client
            # from anthropic import Anthropic
            # self.client = Anthropic(api_key=settings.anthropic_api_key)
            raise NotImplementedError("Real Anthropic API not yet implemented")
    
    def plan(self, workout_text: str) -> dict:
        """
        Plan the parsing approach based on workout text.
        
        Returns a plan describing how the workout will be parsed.
        """
        workout_lower = workout_text.lower()
        
        if "amrap" in workout_lower:
            workout_type = "AMRAP"
        elif any(kw in workout_lower for kw in ["rft", "for time", "rounds for time"]):
            workout_type = "RFT"
        elif "emom" in workout_lower:
            workout_type = "EMOM"
        elif "tabata" in workout_lower:
            workout_type = "Tabata"
        else:
            workout_type = "Chipper"
        
        return {
            "workout_type": workout_type,
            "strategy": f"Parse as {workout_type} format",
            "expected_phases": ["warm_up", "main_work", "cooldown"]
        }
    
    def execute(self, workout_text: str) -> WorkoutStructure:
        """
        Execute the parsing of workout text.
        
        Args:
            workout_text: Raw workout description
            
        Returns:
            Structured workout with phases and BPM ranges
        """
        logger.info(f"Parsing workout: {workout_text[:50]}...")
        
        try:
            workout_structure = self.client.parse_workout(workout_text)
            logger.info(f"Successfully parsed workout: {workout_structure.workout_name}")
            return workout_structure
        except Exception as e:
            logger.error(f"Error parsing workout: {e}")
            raise
    
    def validate(self, workout: WorkoutStructure) -> tuple[bool, Optional[str]]:
        """
        Validate the parsed workout structure.
        
        Args:
            workout: Parsed workout structure
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check minimum requirements
        if not workout.phases:
            return False, "Workout must have at least one phase"
        
        if workout.total_duration_min <= 0:
            return False, "Total duration must be positive"
        
        # Validate phase durations sum correctly
        phase_sum = sum(p.duration_min for p in workout.phases)
        if abs(phase_sum - workout.total_duration_min) > 1:  # Allow 1 min tolerance
            return False, f"Phase durations ({phase_sum} min) don't match total ({workout.total_duration_min} min)"
        
        # Validate BPM ranges
        for phase in workout.phases:
            bpm_min, bpm_max = phase.bpm_range
            if bpm_min >= bpm_max:
                return False, f"Invalid BPM range for {phase.name}: {bpm_min}-{bpm_max}"
            if bpm_min < 60 or bpm_max > 200:
                return False, f"BPM range out of bounds for {phase.name}: {bpm_min}-{bpm_max}"
        
        logger.info(f"Workout validation passed: {workout.workout_name}")
        return True, None
    
    def parse_and_validate(self, workout_text: str) -> WorkoutStructure:
        """
        Complete workflow: plan, execute, and validate workout parsing.
        
        Args:
            workout_text: Raw workout description
            
        Returns:
            Validated workout structure
            
        Raises:
            ValueError: If validation fails
        """
        # Plan
        plan = self.plan(workout_text)
        logger.debug(f"Parse plan: {plan}")
        
        # Execute
        workout = self.execute(workout_text)
        
        # Validate
        is_valid, error_msg = self.validate(workout)
        if not is_valid:
            raise ValueError(f"Invalid workout structure: {error_msg}")
        
        return workout

