with source as (

    select * from {{ source('crank', 'raw_playlists') }}

),

cleaned as (

    select
        playlist_id,
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

    from source

)

select * from cleaned
