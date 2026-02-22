with source as (

    select * from {{ source('crank', 'raw_users') }}

),

cleaned as (

    select
        user_id,
        created_at,
        signup_source,
        preferred_genre,
        has_spotify_premium,
        country

    from source

)

select * from cleaned
