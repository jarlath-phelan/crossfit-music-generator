MODEL (
  name crank.stg_tracks,
  kind FULL,
  grain track_id,
  description 'Clean track catalog'
);

SELECT
  track_id,
  track_name,
  artist,
  bpm,
  energy,
  genre,
  spotify_uri,
  album_art_url
FROM raw_tracks;
