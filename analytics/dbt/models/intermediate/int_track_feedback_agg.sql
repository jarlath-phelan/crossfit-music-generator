with track_events as (

    select * from {{ source('crank', 'raw_track_events') }}
    where action in ('thumbs_up', 'thumbs_down')

),

aggregated as (

    select
        track_id,
        track_name,
        artist,
        count(case when action = 'thumbs_up' then 1 end) as thumbs_up_count,
        count(case when action = 'thumbs_down' then 1 end) as thumbs_down_count,
        count(*) as total_feedback,
        count(case when action = 'thumbs_up' then 1 end)
            - count(case when action = 'thumbs_down' then 1 end) as net_sentiment

    from track_events
    group by track_id, track_name, artist

)

select * from aggregated
