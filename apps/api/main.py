"""
FastAPI application for CrossFit Playlist Generator
"""
import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from models.schemas import GeneratePlaylistRequest, GeneratePlaylistResponse, Track
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
spotify_client: Optional[object] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global workout_parser, music_curator, playlist_composer, spotify_client

    logger.info("Validating configuration...")
    settings.validate_api_keys()

    logger.info("Initializing agents...")
    workout_parser = WorkoutParserAgent()
    music_curator = MusicCuratorAgent()
    playlist_composer = PlaylistComposerAgent(curator=music_curator)

    # Initialize Spotify client if credentials are available
    if not settings.use_mock_spotify and settings.spotify_client_id and settings.spotify_client_secret:
        try:
            from clients.spotify_client import SpotifyClient
            spotify_client = SpotifyClient()
            logger.info("Spotify client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Spotify client: {e}")
            spotify_client = None
    else:
        logger.info("Spotify integration disabled (mock mode or missing credentials)")

    logger.info("Agents initialized successfully")

    yield

    logger.info("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title="CrossFit Playlist Generator API",
    description="Generate workout playlists from CrossFit workout text or photos",
    version="3.0.0",
    lifespan=lifespan
)

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS - parse comma-separated origins for dev + production
_allowed_origins = [o.strip() for o in settings.frontend_url.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Content-Type", "Authorization",
        "X-User-ID", "X-User-Genre", "X-User-Exclude-Artists", "X-User-Min-Energy",
        "X-User-Boost-Artists", "X-User-Hidden-Tracks",
    ],
)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "CrossFit Playlist Generator API",
        "version": "3.0.0",
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
        "spotify_enabled": spotify_client is not None,
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
            "spotify_enabled": spotify_client is not None,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "agents": agent_status,
            "error": str(e)
        }


def _resolve_spotify(playlist) -> None:
    """Resolve playlist tracks to Spotify URIs if Spotify client is available."""
    if not spotify_client:
        return

    logger.info("Step 3: Resolving tracks on Spotify...")
    track_dicts = [
        {"name": t.name, "artist": t.artist}
        for t in playlist.tracks
    ]

    resolved = spotify_client.resolve_tracks(track_dicts)

    for i, resolved_data in enumerate(resolved):
        track = playlist.tracks[i]
        if "spotify_uri" in resolved_data:
            playlist.tracks[i] = Track(
                id=track.id,
                name=track.name,
                artist=track.artist,
                bpm=track.bpm,
                energy=track.energy,
                duration_ms=resolved_data.get("duration_ms", track.duration_ms),
                spotify_url=resolved_data.get("spotify_url"),
                spotify_uri=resolved_data.get("spotify_uri"),
                album_art_url=resolved_data.get("album_art_url"),
            )


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
    2. Find tracks matching each phase's BPM range → compose playlist
    3. Resolve tracks on Spotify (if enabled) → URIs + album art
    """
    has_text = body.workout_text and body.workout_text.strip()
    has_image = body.workout_image_base64 and body.image_media_type

    if not has_text and not has_image:
        raise HTTPException(
            status_code=400,
            detail="Either workout_text or workout_image_base64 (with image_media_type) is required"
        )

    # Extract user preference headers (set by Next.js server actions)
    user_id = request.headers.get("X-User-ID")
    user_genre = request.headers.get("X-User-Genre")
    user_exclude_artists = request.headers.get("X-User-Exclude-Artists")
    user_min_energy_str = request.headers.get("X-User-Min-Energy")
    user_min_energy = float(user_min_energy_str) if user_min_energy_str else None
    user_boost_artists = request.headers.get("X-User-Boost-Artists")
    user_hidden_tracks = request.headers.get("X-User-Hidden-Tracks")

    if user_id:
        logger.info(f"Authenticated request from user {user_id}")
    if user_genre:
        logger.info(f"User genre preference: {user_genre}")

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

        # Step 2: Compose playlist (with user preferences)
        logger.info("Step 2: Composing playlist...")
        exclude_set = set()
        if user_exclude_artists:
            exclude_set = {a.strip() for a in user_exclude_artists.split(",") if a.strip()}
        boost_set = set()
        if user_boost_artists:
            boost_set = {a.strip() for a in user_boost_artists.split(",") if a.strip()}
        hidden_set = set()
        if user_hidden_tracks:
            hidden_set = {t.strip() for t in user_hidden_tracks.split(",") if t.strip()}
        playlist = playlist_composer.compose_and_validate(
            workout,
            genre=user_genre,
            min_energy=user_min_energy,
            exclude_artists=exclude_set,
            boost_artists=boost_set,
            hidden_tracks=hidden_set,
        )
        logger.info(f"Composed playlist: {len(playlist.tracks)} tracks")

        # Step 3: Resolve on Spotify (if enabled)
        _resolve_spotify(playlist)

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
