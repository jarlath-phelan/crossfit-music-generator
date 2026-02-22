MODEL (
  name crank.fct_playback,
  kind FULL,
  grain playback_id,
  description 'One row per playback event'
);

SELECT
  event_id AS playback_id,
  user_id,
  track_id,
  track_name,
  artist,
  action,
  position_ms,
  duration_ms,
  played_at
FROM raw_track_events
WHERE action IN ('play', 'pause', 'skip', 'seek', 'complete');
