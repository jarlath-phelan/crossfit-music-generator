with users as (

    select * from {{ ref('stg_users') }}

),

generation_stats as (

    select
        user_id,
        count(*) as total_generations,
        max(generated_at) as last_generation_at

    from {{ ref('fct_generations') }}
    group by user_id

),

playback_stats as (

    select
        user_id,
        count(*) as total_playbacks,
        max(played_at) as last_playback_at

    from {{ ref('fct_playback') }}
    group by user_id

),

enriched as (

    select
        u.user_id,
        u.created_at as first_seen_at,

        -- Last activity is the most recent of generation or playback
        greatest(
            coalesce(g.last_generation_at, u.created_at),
            coalesce(p.last_playback_at, u.created_at)
        ) as last_seen_at,

        coalesce(g.total_generations, 0) as total_generations,
        coalesce(p.total_playbacks, 0) as total_playbacks,
        u.preferred_genre,
        u.signup_source,

        -- Days active: difference between first and last seen
        date_diff(
            'day',
            CAST(u.created_at as DATE),
            CAST(greatest(
                coalesce(g.last_generation_at, u.created_at),
                coalesce(p.last_playback_at, u.created_at)
            ) as DATE)
        ) + 1 as days_active

    from users u
    left join generation_stats g on u.user_id = g.user_id
    left join playback_stats p on u.user_id = p.user_id

)

select * from enriched
