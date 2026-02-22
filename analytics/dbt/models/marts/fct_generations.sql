with playlists as (

    select * from {{ ref('stg_playlists') }}

)

select
    playlist_id as generation_id,
    user_id,
    genre,
    workout_type,
    workout_name,
    input_mode,
    phase_count,
    track_count,
    duration_ms,
    peak_bpm,
    elapsed_ms,
    has_spotify,
    generated_at

from playlists
