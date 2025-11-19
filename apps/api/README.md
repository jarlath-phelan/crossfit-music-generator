# CrossFit Playlist Generator API

FastAPI backend with agent-based architecture for generating workout playlists.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env if using real API keys
```

## Running

Development server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

The API works out-of-the-box with mock implementations:
- Mock Anthropic API parses workouts using pattern matching
- Mock Spotify API uses an in-memory track database

To use real APIs, set `USE_MOCK_ANTHROPIC=false` and `USE_MOCK_SPOTIFY=false` in `.env` and provide API keys.

