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
    
    # Feature Flags
    use_mock_anthropic: bool = True
    use_mock_spotify: bool = True
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()

