"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # API Keys
    anthropic_api_key: Optional[str] = None
    spotify_client_id: Optional[str] = None
    spotify_client_secret: Optional[str] = None
    spotify_redirect_uri: str = "http://localhost:8000/api/v1/spotify/callback"

    # Claude Model Configuration
    anthropic_model: str = "claude-haiku-4-5-20251001"

    # Music Source Configuration
    music_source: str = "mock"  # "mock", "getsongbpm", "soundnet", "claude"
    getsongbpm_api_key: Optional[str] = None
    soundnet_api_key: Optional[str] = None

    # API Security
    api_shared_secret: Optional[str] = None  # HMAC shared secret with frontend

    # PostHog
    posthog_api_key: Optional[str] = None

    # Supabase
    supabase_url: Optional[str] = None
    supabase_service_key: Optional[str] = None

    # Feature Flags
    use_mock_anthropic: bool = True
    use_mock_spotify: bool = True

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    frontend_url: str = "http://localhost:3000,https://crossfit-music-generator.vercel.app"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    def validate_api_keys(self) -> None:
        """Validate that required API keys are present when not using mocks"""
        if not self.use_mock_anthropic and not self.anthropic_api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is required when USE_MOCK_ANTHROPIC=false"
            )
        if not self.use_mock_spotify and (
            not self.spotify_client_id or not self.spotify_client_secret
        ):
            raise ValueError(
                "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required "
                "when USE_MOCK_SPOTIFY=false"
            )


# Global settings instance
settings = Settings()
