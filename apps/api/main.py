"""
FastAPI application for CrossFit Playlist Generator
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

# Global agent instances
workout_parser: WorkoutParserAgent
music_curator: MusicCuratorAgent
playlist_composer: PlaylistComposerAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    global workout_parser, music_curator, playlist_composer
    
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
    description="Generate workout playlists from CrossFit workout text",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "CrossFit Playlist Generator API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "generate": "POST /api/v1/generate"
        },
        "mock_mode": {
            "anthropic": settings.use_mock_anthropic,
            "spotify": settings.use_mock_spotify
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agents": {
            "workout_parser": "initialized",
            "music_curator": "initialized",
            "playlist_composer": "initialized"
        }
    }


@app.post("/api/v1/generate", response_model=GeneratePlaylistResponse)
async def generate_playlist(request: GeneratePlaylistRequest):
    """
    Generate a playlist from workout text.
    
    This endpoint:
    1. Parses the workout text into structured phases
    2. Curates music tracks matching each phase's intensity
    3. Composes an optimized playlist with smooth transitions
    
    Args:
        request: Contains workout_text string
        
    Returns:
        GeneratePlaylistResponse with workout structure and playlist
        
    Raises:
        HTTPException: If parsing or generation fails
    """
    logger.info(f"Received playlist generation request: {request.workout_text[:50]}...")
    
    try:
        # Step 1: Parse workout
        logger.info("Step 1: Parsing workout...")
        workout = workout_parser.parse_and_validate(request.workout_text)
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

