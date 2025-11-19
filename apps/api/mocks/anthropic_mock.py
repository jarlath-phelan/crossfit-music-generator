"""
Mock Anthropic API implementation for workout parsing
Uses pattern matching instead of real Claude API calls
"""
import re
from typing import Optional
from models.schemas import WorkoutStructure, Phase


class MockAnthropicClient:
    """Mock Claude API client that parses workouts using regex patterns"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize mock client (api_key not required)"""
        self.api_key = api_key
    
    def parse_workout(self, workout_text: str) -> WorkoutStructure:
        """Parse workout text into structured format"""
        workout_text_lower = workout_text.lower()
        
        # Detect workout type and parse accordingly
        if "amrap" in workout_text_lower:
            return self._parse_amrap(workout_text)
        elif any(keyword in workout_text_lower for keyword in ["rft", "for time", "rounds for time"]):
            return self._parse_rft(workout_text)
        elif "emom" in workout_text_lower:
            return self._parse_emom(workout_text)
        elif "tabata" in workout_text_lower:
            return self._parse_tabata(workout_text)
        else:
            return self._parse_chipper(workout_text)
    
    def _parse_amrap(self, workout_text: str) -> WorkoutStructure:
        """Parse AMRAP (As Many Rounds As Possible) workouts"""
        # Extract duration (e.g., "20 minute AMRAP" or "AMRAP 20")
        duration_match = re.search(r'(\d+)\s*(?:minute|min)', workout_text.lower())
        main_duration = int(duration_match.group(1)) if duration_match else 15
        
        phases = [
            Phase(
                name="Warm-up",
                duration_min=5,
                intensity="warm_up",
                bpm_range=(100, 120)
            ),
            Phase(
                name="AMRAP Work",
                duration_min=main_duration,
                intensity="high",
                bpm_range=(145, 160)
            ),
            Phase(
                name="Cooldown",
                duration_min=3,
                intensity="cooldown",
                bpm_range=(80, 100)
            )
        ]
        
        return WorkoutStructure(
            workout_name=f"{main_duration} Minute AMRAP",
            total_duration_min=5 + main_duration + 3,
            phases=phases
        )
    
    def _parse_rft(self, workout_text: str) -> WorkoutStructure:
        """Parse RFT (Rounds For Time) workouts"""
        # Extract number of rounds (e.g., "5 rounds for time" or "21-15-9")
        rounds_match = re.search(r'(\d+)\s*(?:rounds?|rds?)', workout_text.lower())
        descending_match = re.search(r'(\d+)-(\d+)-(\d+)', workout_text)
        
        if descending_match:
            workout_name = f"{descending_match.group(1)}-{descending_match.group(2)}-{descending_match.group(3)}"
            main_duration = 12  # Descending reps usually faster
        elif rounds_match:
            rounds = int(rounds_match.group(1))
            workout_name = f"{rounds} Rounds For Time"
            main_duration = rounds * 3  # Estimate 3 min per round
        else:
            workout_name = "For Time"
            main_duration = 15
        
        phases = [
            Phase(
                name="Warm-up",
                duration_min=5,
                intensity="warm_up",
                bpm_range=(100, 120)
            ),
            Phase(
                name="Main WOD",
                duration_min=main_duration,
                intensity="very_high",
                bpm_range=(160, 175)
            ),
            Phase(
                name="Cooldown",
                duration_min=3,
                intensity="cooldown",
                bpm_range=(80, 100)
            )
        ]
        
        return WorkoutStructure(
            workout_name=workout_name,
            total_duration_min=5 + main_duration + 3,
            phases=phases
        )
    
    def _parse_emom(self, workout_text: str) -> WorkoutStructure:
        """Parse EMOM (Every Minute On the Minute) workouts"""
        # Extract duration
        duration_match = re.search(r'(\d+)\s*(?:minute|min)', workout_text.lower())
        main_duration = int(duration_match.group(1)) if duration_match else 12
        
        phases = [
            Phase(
                name="Warm-up",
                duration_min=5,
                intensity="warm_up",
                bpm_range=(100, 120)
            ),
            Phase(
                name="EMOM Work",
                duration_min=main_duration,
                intensity="moderate",
                bpm_range=(130, 145)
            ),
            Phase(
                name="Cooldown",
                duration_min=3,
                intensity="cooldown",
                bpm_range=(80, 100)
            )
        ]
        
        return WorkoutStructure(
            workout_name=f"{main_duration} Minute EMOM",
            total_duration_min=5 + main_duration + 3,
            phases=phases
        )
    
    def _parse_tabata(self, workout_text: str) -> WorkoutStructure:
        """Parse Tabata workouts (20 sec on, 10 sec off)"""
        # Tabata is typically 8 rounds = 4 minutes per exercise
        exercises = len(re.findall(r'\n|,', workout_text)) + 1
        main_duration = exercises * 4
        
        phases = [
            Phase(
                name="Warm-up",
                duration_min=3,
                intensity="warm_up",
                bpm_range=(100, 120)
            ),
            Phase(
                name="Tabata Intervals",
                duration_min=main_duration,
                intensity="very_high",
                bpm_range=(160, 175)
            ),
            Phase(
                name="Cooldown",
                duration_min=2,
                intensity="cooldown",
                bpm_range=(80, 100)
            )
        ]
        
        return WorkoutStructure(
            workout_name="Tabata",
            total_duration_min=3 + main_duration + 2,
            phases=phases
        )
    
    def _parse_chipper(self, workout_text: str) -> WorkoutStructure:
        """Parse chipper workouts (long list of movements done once)"""
        # Count movements (rough heuristic)
        movements = len(re.findall(r'\d+\s+\w+', workout_text))
        main_duration = max(movements * 2, 15)  # Estimate 2 min per movement
        
        phases = [
            Phase(
                name="Warm-up",
                duration_min=5,
                intensity="warm_up",
                bpm_range=(100, 120)
            ),
            Phase(
                name="Chipper",
                duration_min=main_duration,
                intensity="moderate",
                bpm_range=(130, 145)
            ),
            Phase(
                name="Cooldown",
                duration_min=3,
                intensity="cooldown",
                bpm_range=(80, 100)
            )
        ]
        
        return WorkoutStructure(
            workout_name="Chipper",
            total_duration_min=5 + main_duration + 3,
            phases=phases
        )

