MODEL (
  name crank.fct_generations,
  kind INCREMENTAL_BY_TIME_RANGE (
    time_column generated_at
  ),
  grain generation_id,
  description 'One row per playlist generation'
);

SELECT
  playlist_id AS generation_id,
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
FROM crank.stg_playlists
WHERE generated_at BETWEEN @start_ds AND @end_ds;
