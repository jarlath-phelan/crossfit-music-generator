with source as (

    select * from {{ source('crank', 'raw_tracks') }}

),

cleaned as (

    select
        track_id,
        track_name,
        artist,
        bpm,
        energy,
        genre,
        spotify_uri,
        album_art_url

    from source

)

select * from cleaned
