"""
FastAPI application for CrossFit Playlist Generator
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from models.schemas import GeneratePlaylistRequest, GeneratePlaylistResponse
from agents.workout_parser import WorkoutParserAgent
from agents.music_curator import MusicCuratorAgent
from agents.playlist_composer import PlaylistComposerAgent

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

# Global agent instances
workout_parser: WorkoutParserAgent
music_curator: MusicCuratorAgent
playlist_composer: PlaylistComposerAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global workout_parser, music_curator, playlist_composer

    logger.info("Validating configuration...")
    settings.validate_api_keys()

    logger.info("Initializing agents...")
    workout_parser = WorkoutParserAgent()
    music_curator = MusicCuratorAgent()
    playlist_composer = PlaylistComposerAgent(curator=music_curator)
    logger.info("Agents initialized successfully")

    yield

    logger.info("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title="CrossFit Playlist Generator API",
    description="Generate workout playlists from CrossFit workout text or photos",
    version="2.0.0",
    lifespan=lifespan
)

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS - use specific origins for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "CrossFit Playlist Generator API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "generate": "POST /api/v1/generate"
        },
        "mock_mode": {
            "anthropic": settings.use_mock_anthropic,
            "spotify": settings.use_mock_spotify
        },
        "music_source": settings.music_source,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint - verifies all agents are operational"""
    agent_status = {}

    # Check if agents are initialized
    try:
        agent_status["workout_parser"] = "healthy" if workout_parser else "not_initialized"
        agent_status["music_curator"] = "healthy" if music_curator else "not_initialized"
        agent_status["playlist_composer"] = "healthy" if playlist_composer else "not_initialized"

        # Verify agents have required attributes
        if not hasattr(workout_parser, 'parse_and_validate'):
            agent_status["workout_parser"] = "invalid"
        if not hasattr(music_curator, 'select_track_for_phase'):
            agent_status["music_curator"] = "invalid"
        if not hasattr(playlist_composer, 'compose_and_validate'):
            agent_status["playlist_composer"] = "invalid"

        all_healthy = all(status == "healthy" for status in agent_status.values())

        return {
            "status": "healthy" if all_healthy else "degraded",
            "agents": agent_status,
            "mock_mode": {
                "anthropic": settings.use_mock_anthropic,
                "spotify": settings.use_mock_spotify
            },
            "music_source": settings.music_source,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "agents": agent_status,
            "error": str(e)
        }


@app.post("/api/v1/generate", response_model=GeneratePlaylistResponse)
@limiter.limit("10/minute")
async def generate_playlist(body: GeneratePlaylistRequest, request: Request):
    """
    Generate a playlist from workout text or image.

    Accepts either:
    - workout_text: Text description of a workout
    - workout_image_base64 + image_media_type: Photo of a whiteboard

    Rate limit: 10 requests per minute per IP address.

    Pipeline:
    1. Parse workout (text or image) → structured phases
    2. Find tracks matching each phase's BPM range
    3. Score and rank candidates
    4. Compose optimized playlist with smooth transitions
    """
    has_text = body.workout_text and body.workout_text.strip()
    has_image = body.workout_image_base64 and body.image_media_type

    if not has_text and not has_image:
        raise HTTPException(
            status_code=400,
            detail="Either workout_text or workout_image_base64 (with image_media_type) is required"
        )

    if has_text:
        logger.info(f"Received text-based request: {body.workout_text[:50]}...")
    else:
        logger.info(f"Received image-based request ({body.image_media_type})")

    try:
        # Step 1: Parse workout
        logger.info("Step 1: Parsing workout...")
        if has_image:
            workout = workout_parser.parse_image_and_validate(
                body.workout_image_base64,
                body.image_media_type,
                additional_text=body.workout_text or "",
            )
        else:
            workout = workout_parser.parse_and_validate(body.workout_text)
        logger.info(f"Parsed workout: {workout.workout_name} ({workout.total_duration_min} min)")

        # Step 2: Compose playlist
        logger.info("Step 2: Composing playlist...")
        playlist = playlist_composer.compose_and_validate(workout)
        logger.info(f"Composed playlist: {len(playlist.tracks)} tracks")

        # Return response
        response = GeneratePlaylistResponse(
            workout=workout,
            playlist=playlist
        )

        logger.info("Successfully generated playlist")
        return response

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except NotImplementedError as e:
        logger.error(f"Feature not available: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate playlist: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "type": type(exc).__name__
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level
    )
