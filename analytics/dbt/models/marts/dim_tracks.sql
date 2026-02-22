with tracks as (

    select * from {{ ref('stg_tracks') }}

),

feedback as (

    select * from {{ ref('int_track_feedback_agg') }}

),

playback_counts as (

    select
        track_id,
        count(*) as total_plays

    from {{ ref('fct_playback') }}
    where action = 'play'
    group by track_id

),

enriched as (

    select
        t.track_id,
        t.track_name,
        t.artist,
        t.bpm,
        t.energy,
        t.genre,
        coalesce(f.thumbs_up_count, 0) as thumbs_up_count,
        coalesce(f.thumbs_down_count, 0) as thumbs_down_count,
        coalesce(f.net_sentiment, 0) as net_sentiment,
        coalesce(p.total_plays, 0) as total_plays

    from tracks t
    left join feedback f on t.track_id = f.track_id
    left join playback_counts p on t.track_id = p.track_id

)

select * from enriched
