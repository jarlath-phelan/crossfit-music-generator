MODEL (
  name crank.stg_users,
  kind FULL,
  grain user_id,
  description 'Clean user dimension'
);

SELECT
  user_id,
  created_at,
  signup_source,
  preferred_genre,
  has_spotify_premium,
  country
FROM raw_users;
