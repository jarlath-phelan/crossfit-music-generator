MODEL (
  name crank.fct_daily_metrics,
  kind FULL,
  grain metric_date,
  description 'Pre-aggregated daily KPIs'
);

WITH daily_events AS (
  SELECT
    CAST(event_timestamp AS DATE) AS metric_date,
    COUNT(DISTINCT user_id) AS dau,
    COUNT(*) FILTER (WHERE event = 'generate_completed') AS generations,
    COUNT(*) FILTER (WHERE event = 'spotify_export_completed') AS exports,
    AVG(elapsed_ms) FILTER (WHERE event = 'generate_completed' AND elapsed_ms IS NOT NULL) AS avg_generation_time_ms,
    COUNT(*) FILTER (WHERE event = 'generate_error') AS error_count
  FROM crank.stg_events
  GROUP BY 1
),
daily_new_users AS (
  SELECT CAST(created_at AS DATE) AS metric_date, COUNT(*) AS new_users
  FROM crank.stg_users
  GROUP BY 1
)
SELECT
  e.metric_date,
  e.dau,
  COALESCE(u.new_users, 0) AS new_users,
  e.generations,
  e.exports,
  ROUND(e.avg_generation_time_ms) AS avg_generation_time_ms,
  e.error_count,
  CASE WHEN e.generations + e.error_count > 0
    THEN ROUND(e.error_count::DOUBLE / (e.generations + e.error_count), 4)
    ELSE 0 END AS error_rate
FROM daily_events e
LEFT JOIN daily_new_users u ON e.metric_date = u.metric_date
ORDER BY e.metric_date;
