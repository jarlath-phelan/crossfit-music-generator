"""
Spotify API client for searching and resolving tracks.
Uses spotipy with client credentials for search,
user auth for playback features.
"""
import logging
import time
from typing import Optional
from dataclasses import dataclass

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

from config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BASE_DELAY = 1.0  # seconds


@dataclass
class SpotifyTrack:
    """Resolved Spotify track with URI, art, and metadata."""
    spotify_uri: str
    spotify_url: str
    name: str
    artist: str
    album_art_url: Optional[str]
    duration_ms: int


class SpotifyClient:
    """
    Spotify API client using client credentials auth.

    Searches Spotify's catalog to resolve track names/artists
    from music sources into playable Spotify URIs.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        self.client_id = client_id or settings.spotify_client_id
        self.client_secret = client_secret or settings.spotify_client_secret

        if not self.client_id or not self.client_secret:
            raise ValueError(
                "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required"
            )

        auth_manager = SpotifyClientCredentials(
            client_id=self.client_id,
            client_secret=self.client_secret,
        )
        self.sp = spotipy.Spotify(auth_manager=auth_manager)

    def search_track(
        self, name: str, artist: str
    ) -> Optional[SpotifyTrack]:
        """
        Search Spotify for a track by name and artist.

        Args:
            name: Track title
            artist: Artist name

        Returns:
            SpotifyTrack if found, None otherwise
        """
        query = f"track:{name} artist:{artist}"

        for attempt in range(MAX_RETRIES):
            try:
                results = self.sp.search(q=query, type="track", limit=1)
                items = results.get("tracks", {}).get("items", [])

                if not items:
                    # Retry with just the track name (less specific)
                    results = self.sp.search(q=name, type="track", limit=5)
                    items = results.get("tracks", {}).get("items", [])
                    # Try to find a match by artist
                    for item in items:
                        item_artists = [a["name"].lower() for a in item.get("artists", [])]
                        if artist.lower() in " ".join(item_artists):
                            items = [item]
                            break
                    else:
                        # Take the first result as best guess
                        if items:
                            items = [items[0]]

                if not items:
                    logger.debug(f"No Spotify match for '{name}' by {artist}")
                    return None

                track = items[0]
                album_images = track.get("album", {}).get("images", [])
                # Prefer 300px image, fallback to first available
                album_art = None
                for img in album_images:
                    if img.get("width", 0) == 300:
                        album_art = img["url"]
                        break
                if not album_art and album_images:
                    album_art = album_images[0]["url"]

                return SpotifyTrack(
                    spotify_uri=track["uri"],
                    spotify_url=track["external_urls"].get("spotify", ""),
                    name=track["name"],
                    artist=", ".join(a["name"] for a in track.get("artists", [])),
                    album_art_url=album_art,
                    duration_ms=track.get("duration_ms", 0),
                )

            except spotipy.SpotifyException as e:
                if e.http_status == 429:
                    # Rate limited — retry with backoff
                    retry_after = int(e.headers.get("Retry-After", RETRY_BASE_DELAY * (2 ** attempt)))
                    logger.warning(f"Spotify rate limited, retrying in {retry_after}s")
                    time.sleep(retry_after)
                    continue
                logger.error(f"Spotify API error searching '{name}': {e}")
                return None
            except Exception as e:
                logger.error(f"Unexpected error searching Spotify for '{name}': {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_BASE_DELAY * (2 ** attempt))
                    continue
                return None

        return None

    def resolve_tracks(
        self, tracks: list[dict],
    ) -> list[dict]:
        """
        Resolve a list of tracks to Spotify URIs.

        Each input dict should have 'name' and 'artist' keys.
        Returns updated dicts with spotify_uri, spotify_url, and album_art_url added.
        Tracks that can't be resolved are returned unchanged.

        Args:
            tracks: List of dicts with 'name' and 'artist' keys

        Returns:
            List of dicts with Spotify data added where resolved
        """
        resolved = []
        resolved_count = 0

        for track_data in tracks:
            name = track_data.get("name", "")
            artist = track_data.get("artist", "")

            spotify_track = self.search_track(name, artist)

            if spotify_track:
                track_data["spotify_uri"] = spotify_track.spotify_uri
                track_data["spotify_url"] = spotify_track.spotify_url
                track_data["album_art_url"] = spotify_track.album_art_url
                # Use Spotify's duration if available (more accurate)
                if spotify_track.duration_ms > 0:
                    track_data["duration_ms"] = spotify_track.duration_ms
                resolved_count += 1

            resolved.append(track_data)

        logger.info(f"Resolved {resolved_count}/{len(tracks)} tracks on Spotify")
        return resolved
