"""
Seed DuckDB with realistic PostHog-style analytics data for Crank.

Generates 90 days of data for ~500 users across 4 tables:
  - raw_events:    ~10K events matching the app's event catalog
  - raw_users:     user dimension with signup metadata
  - raw_playlists: playlist generation records
  - raw_tracks:    track-level data (plays, feedback, skips)

Usage:
    cd analytics && python duckdb/seed.py
    # Creates crank.duckdb in analytics/
"""

import duckdb
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DB_PATH = Path(__file__).resolve().parent.parent / "crank.duckdb"
SEED = 42
NUM_USERS = 500
NUM_DAYS = 90
START_DATE = datetime(2025, 11, 24)  # 90 days back from ~Feb 22 2026

GENRES = ["Rock", "Hip-Hop", "EDM", "Metal", "Pop", "Punk", "Country", "Indie"]
SIGNUP_SOURCES = ["organic", "google", "instagram", "twitter", "friend_referral", "reddit"]
NAMED_WODS = ["Fran", "Murph", "Grace", "DT", "Cindy", "Full Class"]
INPUT_MODES = ["text", "photo", "named_wod"]
PLAYBACK_ACTIONS = ["play", "pause", "skip", "seek", "complete"]
FEEDBACK_TYPES = ["thumbs_up", "thumbs_down"]

ARTISTS = [
    "Metallica", "AC/DC", "Foo Fighters", "Rise Against", "Rage Against the Machine",
    "Led Zeppelin", "Eminem", "Kendrick Lamar", "Drake", "Travis Scott",
    "The Prodigy", "Deadmau5", "Skrillex", "Calvin Harris", "Tiësto",
    "Slipknot", "Avenged Sevenfold", "Five Finger Death Punch", "Disturbed",
    "Taylor Swift", "Dua Lipa", "The Weeknd", "Post Malone", "Imagine Dragons",
    "Green Day", "Blink-182", "The Offspring", "Sum 41", "Bad Religion",
    "Luke Combs", "Morgan Wallen", "Zach Bryan", "Chris Stapleton",
    "Arctic Monkeys", "Tame Impala", "The Strokes", "Vampire Weekend",
]

TRACK_NAMES = [
    "Enter Sandman", "Thunderstruck", "Everlong", "Killing in the Name",
    "Lose Yourself", "HUMBLE.", "Firestarter", "Bangarang",
    "Psychosocial", "Hail to the King", "Down with the Sickness",
    "Shake It Off", "Levitating", "Blinding Lights", "Circles",
    "American Idiot", "All the Small Things", "Self Esteem",
    "Beer Never Broke My Heart", "Last Night", "Something in the Orange",
    "Do I Wanna Know?", "The Less I Know the Better", "Reptilia",
    "Before He Cheats", "Numb", "In the End", "Bohemian Rhapsody",
    "Eye of the Tiger", "We Will Rock You", "Stronger", "Power",
    "Remember the Name", "Till I Collapse", "Centuries", "Warriors",
]

ERROR_TYPES = ["timeout", "api_error", "validation_error", "rate_limit"]


def _rand_dt(day_offset: int) -> datetime:
    """Random datetime within a given day offset from START_DATE."""
    base = START_DATE + timedelta(days=day_offset)
    return base + timedelta(
        hours=random.randint(5, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )


def _event_id() -> str:
    return str(uuid.uuid4())


def _track_id() -> str:
    return f"spotify:track:{uuid.uuid4().hex[:22]}"


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_users(rng: random.Random) -> list[dict]:
    users = []
    for i in range(NUM_USERS):
        signup_day = rng.randint(0, NUM_DAYS - 1)
        users.append({
            "user_id": str(uuid.uuid4()),
            "created_at": _rand_dt(signup_day).isoformat(),
            "signup_source": rng.choice(SIGNUP_SOURCES),
            "preferred_genre": rng.choice(GENRES),
            "has_spotify_premium": rng.random() < 0.6,
            "country": rng.choice(["US", "GB", "CA", "AU", "DE", "IE", "NL"]),
        })
    return users


def generate_tracks(rng: random.Random) -> list[dict]:
    """Pre-generate a catalog of tracks that playlists draw from."""
    tracks = []
    for i, name in enumerate(TRACK_NAMES):
        artist = ARTISTS[i % len(ARTISTS)]
        tracks.append({
            "track_id": _track_id(),
            "track_name": name,
            "artist": artist,
            "bpm": rng.randint(80, 180),
            "energy": round(rng.uniform(0.3, 1.0), 2),
            "genre": rng.choice(GENRES),
            "spotify_uri": f"spotify:track:{uuid.uuid4().hex[:22]}",
            "album_art_url": f"https://i.scdn.co/image/{uuid.uuid4().hex[:40]}",
        })
    return tracks


def generate_events(
    rng: random.Random,
    users: list[dict],
    tracks: list[dict],
) -> tuple[list[dict], list[dict], list[dict]]:
    """Generate raw_events, raw_playlists, raw_tracks rows."""
    events = []
    playlists = []
    track_events = []

    for day in range(NUM_DAYS):
        # ~30-60% of users are active on any given day, growing over time
        activity_rate = 0.05 + (day / NUM_DAYS) * 0.15
        active_users = [u for u in users if rng.random() < activity_rate]

        for user in active_users:
            user_id = user["user_id"]
            ts = _rand_dt(day)

            # Page view
            events.append({
                "event_id": _event_id(),
                "event": "$pageview",
                "distinct_id": user_id,
                "timestamp": ts.isoformat(),
                "properties": json.dumps({"$current_url": "/generate", "$browser": "Chrome"}),
            })

            # ~70% generate a playlist
            if rng.random() < 0.70:
                genre = rng.choice(GENRES)
                input_mode = rng.choice(INPUT_MODES)
                wod_name = rng.choice(NAMED_WODS) if input_mode == "named_wod" else None
                elapsed_ms = rng.randint(8000, 45000)
                is_error = rng.random() < 0.05
                track_count = 0 if is_error else rng.randint(5, 15)
                phase_count = 0 if is_error else rng.randint(3, 7)

                gen_ts = ts + timedelta(seconds=rng.randint(5, 30))

                # generate_submitted
                events.append({
                    "event_id": _event_id(),
                    "event": "generate_submitted",
                    "distinct_id": user_id,
                    "timestamp": gen_ts.isoformat(),
                    "properties": json.dumps({
                        "genre": genre,
                        "input_mode": input_mode,
                        "text_length": rng.randint(20, 500),
                        "has_image": input_mode == "photo",
                        "wod_name": wod_name,
                    }),
                })

                if is_error:
                    events.append({
                        "event_id": _event_id(),
                        "event": "generate_error",
                        "distinct_id": user_id,
                        "timestamp": (gen_ts + timedelta(milliseconds=elapsed_ms)).isoformat(),
                        "properties": json.dumps({
                            "error_type": rng.choice(ERROR_TYPES),
                            "status_code": rng.choice([408, 500, 502, 429]),
                        }),
                    })
                    continue

                gen_complete_ts = gen_ts + timedelta(milliseconds=elapsed_ms)
                playlist_id = str(uuid.uuid4())

                # generate_completed
                events.append({
                    "event_id": _event_id(),
                    "event": "generate_completed",
                    "distinct_id": user_id,
                    "timestamp": gen_complete_ts.isoformat(),
                    "properties": json.dumps({
                        "elapsed_ms": elapsed_ms,
                        "track_count": track_count,
                        "phase_count": phase_count,
                        "playlist_id": playlist_id,
                    }),
                })

                # Playlist record
                selected_tracks = rng.sample(tracks, min(track_count, len(tracks)))
                playlists.append({
                    "playlist_id": playlist_id,
                    "user_id": user_id,
                    "genre": genre,
                    "workout_type": wod_name or "custom",
                    "workout_name": wod_name,
                    "input_mode": input_mode,
                    "phase_count": phase_count,
                    "track_count": track_count,
                    "duration_ms": sum(rng.randint(180000, 300000) for _ in range(track_count)),
                    "peak_bpm": max((t["bpm"] for t in selected_tracks), default=0),
                    "elapsed_ms": elapsed_ms,
                    "has_spotify": user["has_spotify_premium"],
                    "generated_at": gen_complete_ts.isoformat(),
                })

                # genre_selected event
                events.append({
                    "event_id": _event_id(),
                    "event": "genre_selected",
                    "distinct_id": user_id,
                    "timestamp": gen_ts.isoformat(),
                    "properties": json.dumps({"genre": genre}),
                })

                if wod_name:
                    events.append({
                        "event_id": _event_id(),
                        "event": "named_wod_selected",
                        "distinct_id": user_id,
                        "timestamp": gen_ts.isoformat(),
                        "properties": json.dumps({"wod_name": wod_name}),
                    })

                # Playback events (~50% of successful generations)
                if rng.random() < 0.50 and selected_tracks:
                    play_ts = gen_complete_ts + timedelta(seconds=rng.randint(2, 60))
                    for track in selected_tracks[:rng.randint(1, len(selected_tracks))]:
                        action = rng.choice(PLAYBACK_ACTIONS)
                        duration_ms = rng.randint(30000, 300000)
                        position_ms = rng.randint(0, duration_ms)

                        track_events.append({
                            "event_id": _event_id(),
                            "user_id": user_id,
                            "playlist_id": playlist_id,
                            "track_id": track["track_id"],
                            "track_name": track["track_name"],
                            "artist": track["artist"],
                            "action": action,
                            "position_ms": position_ms,
                            "duration_ms": duration_ms,
                            "played_at": play_ts.isoformat(),
                        })

                        events.append({
                            "event_id": _event_id(),
                            "event": f"playback_{action}",
                            "distinct_id": user_id,
                            "timestamp": play_ts.isoformat(),
                            "properties": json.dumps({
                                "track_id": track["track_id"],
                                "track_name": track["track_name"],
                                "artist": track["artist"],
                                "action": action,
                                "position_ms": position_ms,
                            }),
                        })

                        play_ts += timedelta(seconds=rng.randint(30, 300))

                # Feedback events (~20% of successful generations)
                if rng.random() < 0.20 and selected_tracks:
                    fb_track = rng.choice(selected_tracks)
                    fb_type = rng.choice(FEEDBACK_TYPES)
                    fb_ts = gen_complete_ts + timedelta(seconds=rng.randint(60, 600))

                    track_events.append({
                        "event_id": _event_id(),
                        "user_id": user_id,
                        "playlist_id": playlist_id,
                        "track_id": fb_track["track_id"],
                        "track_name": fb_track["track_name"],
                        "artist": fb_track["artist"],
                        "action": fb_type,
                        "position_ms": 0,
                        "duration_ms": 0,
                        "played_at": fb_ts.isoformat(),
                    })

                    events.append({
                        "event_id": _event_id(),
                        "event": f"track_{fb_type}",
                        "distinct_id": user_id,
                        "timestamp": fb_ts.isoformat(),
                        "properties": json.dumps({
                            "track_id": fb_track["track_id"],
                            "track_name": fb_track["track_name"],
                            "artist": fb_track["artist"],
                        }),
                    })

                # Spotify export (~15% of successful generations with premium)
                if rng.random() < 0.15 and user["has_spotify_premium"]:
                    export_ts = gen_complete_ts + timedelta(seconds=rng.randint(10, 300))
                    events.append({
                        "event_id": _event_id(),
                        "event": "spotify_export_completed",
                        "distinct_id": user_id,
                        "timestamp": export_ts.isoformat(),
                        "properties": json.dumps({
                            "playlist_id": playlist_id,
                            "track_count": track_count,
                        }),
                    })

            # Onboarding events for newer users (first 7 days)
            user_created = datetime.fromisoformat(user["created_at"])
            if (ts - user_created).days < 7 and rng.random() < 0.3:
                for step in range(1, rng.randint(2, 4)):
                    events.append({
                        "event_id": _event_id(),
                        "event": "onboarding_step_completed",
                        "distinct_id": user_id,
                        "timestamp": (ts + timedelta(seconds=step * 15)).isoformat(),
                        "properties": json.dumps({"step": step, "total_steps": 3}),
                    })

    return events, playlists, track_events


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    rng = random.Random(SEED)
    random.seed(SEED)

    print(f"Generating seed data for {NUM_USERS} users over {NUM_DAYS} days...")
    users = generate_users(rng)
    tracks = generate_tracks(rng)
    events, playlists, track_events = generate_events(rng, users, tracks)

    print(f"  raw_users:     {len(users):,}")
    print(f"  raw_tracks:    {len(tracks):,}")
    print(f"  raw_events:    {len(events):,}")
    print(f"  raw_playlists: {len(playlists):,}")
    print(f"  raw_track_events: {len(track_events):,}")

    # Remove old DB if exists
    DB_PATH.unlink(missing_ok=True)

    con = duckdb.connect(str(DB_PATH))

    # Create and populate tables
    con.execute("""
        CREATE TABLE raw_users (
            user_id VARCHAR PRIMARY KEY,
            created_at TIMESTAMP,
            signup_source VARCHAR,
            preferred_genre VARCHAR,
            has_spotify_premium BOOLEAN,
            country VARCHAR
        )
    """)
    con.executemany(
        "INSERT INTO raw_users VALUES (?, ?, ?, ?, ?, ?)",
        [(u["user_id"], u["created_at"], u["signup_source"],
          u["preferred_genre"], u["has_spotify_premium"], u["country"]) for u in users],
    )

    con.execute("""
        CREATE TABLE raw_tracks (
            track_id VARCHAR PRIMARY KEY,
            track_name VARCHAR,
            artist VARCHAR,
            bpm INTEGER,
            energy DOUBLE,
            genre VARCHAR,
            spotify_uri VARCHAR,
            album_art_url VARCHAR
        )
    """)
    con.executemany(
        "INSERT INTO raw_tracks VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [(t["track_id"], t["track_name"], t["artist"], t["bpm"],
          t["energy"], t["genre"], t["spotify_uri"], t["album_art_url"]) for t in tracks],
    )

    con.execute("""
        CREATE TABLE raw_events (
            event_id VARCHAR PRIMARY KEY,
            event VARCHAR,
            distinct_id VARCHAR,
            timestamp TIMESTAMP,
            properties JSON
        )
    """)
    con.executemany(
        "INSERT INTO raw_events VALUES (?, ?, ?, ?, ?)",
        [(e["event_id"], e["event"], e["distinct_id"],
          e["timestamp"], e["properties"]) for e in events],
    )

    con.execute("""
        CREATE TABLE raw_playlists (
            playlist_id VARCHAR PRIMARY KEY,
            user_id VARCHAR,
            genre VARCHAR,
            workout_type VARCHAR,
            workout_name VARCHAR,
            input_mode VARCHAR,
            phase_count INTEGER,
            track_count INTEGER,
            duration_ms BIGINT,
            peak_bpm INTEGER,
            elapsed_ms INTEGER,
            has_spotify BOOLEAN,
            generated_at TIMESTAMP
        )
    """)
    con.executemany(
        "INSERT INTO raw_playlists VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [(p["playlist_id"], p["user_id"], p["genre"], p["workout_type"],
          p["workout_name"], p["input_mode"], p["phase_count"], p["track_count"],
          p["duration_ms"], p["peak_bpm"], p["elapsed_ms"], p["has_spotify"],
          p["generated_at"]) for p in playlists],
    )

    con.execute("""
        CREATE TABLE raw_track_events (
            event_id VARCHAR PRIMARY KEY,
            user_id VARCHAR,
            playlist_id VARCHAR,
            track_id VARCHAR,
            track_name VARCHAR,
            artist VARCHAR,
            action VARCHAR,
            position_ms INTEGER,
            duration_ms INTEGER,
            played_at TIMESTAMP
        )
    """)
    con.executemany(
        "INSERT INTO raw_track_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [(t["event_id"], t["user_id"], t["playlist_id"], t["track_id"],
          t["track_name"], t["artist"], t["action"], t["position_ms"],
          t["duration_ms"], t["played_at"]) for t in track_events],
    )

    con.close()
    print(f"\nDatabase created at: {DB_PATH}")
    print("Done!")


if __name__ == "__main__":
    main()
