"""
Real Anthropic Claude API client for workout parsing.
Uses tool_use for structured output.
"""
import json
import logging
import time
from typing import Optional

import anthropic

from config import settings
from models.schemas import WorkoutStructure, Phase

logger = logging.getLogger(__name__)

# BPM mapping used in the system prompt
BPM_MAPPING = {
    "warm_up": (100, 120),
    "low": (120, 130),
    "moderate": (130, 145),
    "high": (145, 160),
    "very_high": (160, 175),
    "cooldown": (80, 100),
}

# Tool definition for structured workout output
WORKOUT_TOOL = {
    "name": "parse_workout",
    "description": "Parse a CrossFit workout into structured phases with intensity levels and BPM ranges for music matching.",
    "input_schema": {
        "type": "object",
        "properties": {
            "workout_name": {
                "type": "string",
                "description": "Short descriptive name for the workout (e.g. '20 Minute AMRAP', 'Fran', '21-15-9')",
            },
            "total_duration_min": {
                "type": "integer",
                "description": "Total workout duration in minutes including warm-up and cooldown",
                "minimum": 1,
            },
            "phases": {
                "type": "array",
                "description": "Ordered list of workout phases",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Phase name (e.g. 'Warm-up', 'Main WOD', 'AMRAP Work', 'Cooldown')",
                        },
                        "duration_min": {
                            "type": "integer",
                            "description": "Phase duration in minutes",
                            "minimum": 1,
                        },
                        "intensity": {
                            "type": "string",
                            "enum": [
                                "warm_up",
                                "low",
                                "moderate",
                                "high",
                                "very_high",
                                "cooldown",
                            ],
                            "description": "Intensity level determining music BPM range",
                        },
                        "bpm_range": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "minItems": 2,
                            "maxItems": 2,
                            "description": "Target BPM range [min, max] for music. Must match intensity: warm_up=(100,120), low=(120,130), moderate=(130,145), high=(145,160), very_high=(160,175), cooldown=(80,100)",
                        },
                    },
                    "required": [
                        "name",
                        "duration_min",
                        "intensity",
                        "bpm_range",
                    ],
                },
                "minItems": 1,
            },
        },
        "required": ["workout_name", "total_duration_min", "phases"],
    },
}

SYSTEM_PROMPT = """You are a CrossFit workout parser. Your job is to analyze workout descriptions and break them into structured phases suitable for music matching.

## Rules
1. Every workout MUST have: a warm-up phase, one or more work phases, and a cooldown phase.
2. Warm-up: typically 3-5 minutes, intensity "warm_up", BPM (100, 120).
3. Cooldown: typically 2-3 minutes, intensity "cooldown", BPM (80, 100).
4. Work phase intensity depends on workout type:
   - AMRAP: "high" (145-160 BPM)
   - RFT / For Time / descending reps (21-15-9): "very_high" (160-175 BPM)
   - EMOM: "moderate" (130-145 BPM)
   - Tabata: "very_high" (160-175 BPM)
   - Chipper: "moderate" (130-145 BPM)
   - Strength / skill work: "low" (120-130 BPM)
5. BPM ranges MUST match the intensity level exactly:
   - warm_up: (100, 120)
   - low: (120, 130)
   - moderate: (130, 145)
   - high: (145, 160)
   - very_high: (160, 175)
   - cooldown: (80, 100)
6. The sum of all phase durations MUST equal total_duration_min.
7. If the workout text specifies a duration (e.g. "20 min AMRAP"), use that as the work phase duration.
8. If no duration is specified, estimate based on the workout type and movements.

## Examples
- "AMRAP 20 minutes: 5 pull-ups, 10 push-ups, 15 air squats" → 5 min warm-up + 20 min high + 3 min cooldown = 28 min
- "21-15-9 thrusters and pull-ups" → 5 min warm-up + 12 min very_high + 3 min cooldown = 20 min
- "EMOM 12 minutes: 10 burpees" → 5 min warm-up + 12 min moderate + 3 min cooldown = 20 min

Always use the parse_workout tool to return structured output."""


class AnthropicClient:
    """Real Claude API client for workout parsing using tool_use."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.anthropic_api_key
        self.model = model or settings.anthropic_model
        self.client = anthropic.Anthropic(api_key=self.api_key)

    def parse_workout(self, workout_text: str) -> WorkoutStructure:
        """
        Parse workout text into structured format using Claude API with tool_use.

        Args:
            workout_text: Raw workout description text

        Returns:
            Parsed WorkoutStructure
        """
        logger.info(f"Calling Claude API ({self.model}) to parse workout")
        start = time.time()

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=[WORKOUT_TOOL],
                tool_choice={"type": "tool", "name": "parse_workout"},
                messages=[
                    {
                        "role": "user",
                        "content": f"Parse this CrossFit workout:\n\n{workout_text}",
                    }
                ],
            )
            elapsed = time.time() - start
            logger.info(f"Claude parse response in {elapsed:.1f}s — usage: {response.usage.input_tokens}in/{response.usage.output_tokens}out")
            return self._extract_workout(response)
        except anthropic.APIError as e:
            elapsed = time.time() - start
            logger.error(f"Claude API error after {elapsed:.1f}s: [{type(e).__name__}] {e}")
            raise

    def parse_workout_from_image(
        self, image_base64: str, media_type: str, additional_text: str = ""
    ) -> WorkoutStructure:
        """
        Parse workout from an image (photo of whiteboard) using Claude Vision.

        Args:
            image_base64: Base64-encoded image data
            media_type: MIME type (e.g. "image/jpeg", "image/png")
            additional_text: Optional additional context from the user

        Returns:
            Parsed WorkoutStructure
        """
        logger.info(f"Calling Claude Vision API ({self.model}) to parse workout image")
        start = time.time()

        content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": image_base64,
                },
            },
            {
                "type": "text",
                "text": f"Parse the CrossFit workout shown in this image (likely a whiteboard photo).{f' Additional context: {additional_text}' if additional_text else ''}",
            },
        ]

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=[WORKOUT_TOOL],
                tool_choice={"type": "tool", "name": "parse_workout"},
                messages=[{"role": "user", "content": content}],
            )
            elapsed = time.time() - start
            logger.info(f"Claude vision response in {elapsed:.1f}s — usage: {response.usage.input_tokens}in/{response.usage.output_tokens}out")
            return self._extract_workout(response)
        except anthropic.APIError as e:
            elapsed = time.time() - start
            logger.error(f"Claude Vision API error after {elapsed:.1f}s: [{type(e).__name__}] {e}")
            raise

    def _extract_workout(self, response) -> WorkoutStructure:
        """Extract WorkoutStructure from Claude's tool_use response."""
        for block in response.content:
            if block.type == "tool_use" and block.name == "parse_workout":
                data = block.input
                logger.info(f"Parsed workout: {data.get('workout_name', 'unknown')}")

                phases = [
                    Phase(
                        name=p["name"],
                        duration_min=p["duration_min"],
                        intensity=p["intensity"],
                        bpm_range=tuple(p["bpm_range"]),
                    )
                    for p in data["phases"]
                ]

                return WorkoutStructure(
                    workout_name=data["workout_name"],
                    total_duration_min=data["total_duration_min"],
                    phases=phases,
                )

        raise ValueError("Claude did not return a parse_workout tool call")
