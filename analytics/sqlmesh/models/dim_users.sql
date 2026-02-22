MODEL (
  name crank.dim_users,
  kind FULL,
  grain user_id,
  description 'User dimension with activity aggregates'
);

SELECT
  u.user_id,
  u.created_at AS first_seen_at,
  COALESCE(g.last_generation, u.created_at) AS last_seen_at,
  COALESCE(g.total_generations, 0) AS total_generations,
  COALESCE(p.total_playbacks, 0) AS total_playbacks,
  u.preferred_genre,
  u.signup_source,
  GREATEST(1, date_diff('day', u.created_at, CURRENT_TIMESTAMP)) AS days_active
FROM crank.stg_users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS total_generations, MAX(generated_at) AS last_generation
  FROM crank.fct_generations
  GROUP BY user_id
) g ON u.user_id = g.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS total_playbacks
  FROM crank.fct_playback
  GROUP BY user_id
) p ON u.user_id = p.user_id;
