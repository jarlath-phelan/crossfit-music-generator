with track_events as (

    select * from {{ source('crank', 'raw_track_events') }}
    where action in ('thumbs_up', 'thumbs_down')

)

select
    event_id as feedback_id,
    user_id,
    track_id,
    track_name,
    artist,
    action as feedback_type,
    played_at as given_at

from track_events
