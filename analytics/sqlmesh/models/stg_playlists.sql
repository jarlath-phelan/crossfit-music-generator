MODEL (
  name crank.stg_playlists,
  kind FULL,
  grain playlist_id,
  description 'Clean playlist generation records'
);

SELECT
  playlist_id,
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
FROM raw_playlists;
