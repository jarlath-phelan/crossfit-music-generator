MODEL (
  name crank.dim_tracks,
  kind FULL,
  grain track_id,
  description 'Track dimension with feedback aggregates'
);

SELECT
  t.track_id,
  t.track_name,
  t.artist,
  t.bpm,
  t.energy,
  t.genre,
  COALESCE(fb.thumbs_up_count, 0) AS thumbs_up_count,
  COALESCE(fb.thumbs_down_count, 0) AS thumbs_down_count,
  COALESCE(fb.thumbs_up_count, 0) - COALESCE(fb.thumbs_down_count, 0) AS net_sentiment,
  COALESCE(p.total_plays, 0) AS total_plays
FROM crank.stg_tracks t
LEFT JOIN (
  SELECT
    track_id,
    COUNT(*) FILTER (WHERE action = 'thumbs_up') AS thumbs_up_count,
    COUNT(*) FILTER (WHERE action = 'thumbs_down') AS thumbs_down_count
  FROM raw_track_events
  WHERE action IN ('thumbs_up', 'thumbs_down')
  GROUP BY track_id
) fb ON t.track_id = fb.track_id
LEFT JOIN (
  SELECT track_id, COUNT(*) AS total_plays
  FROM raw_track_events
  WHERE action = 'play'
  GROUP BY track_id
) p ON t.track_id = p.track_id;
