with track_events as (

    select * from {{ source('crank', 'raw_track_events') }}
    where action in ('play', 'pause', 'skip', 'seek', 'complete')

)

select
    event_id as playback_id,
    user_id,
    track_id,
    track_name,
    artist,
    action,
    position_ms,
    duration_ms,
    played_at

from track_events
