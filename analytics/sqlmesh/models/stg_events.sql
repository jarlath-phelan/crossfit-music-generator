MODEL (
  name crank.stg_events,
  kind FULL,
  grain event_id,
  description 'Cleaned events with parsed JSON properties'
);

SELECT
  event_id,
  event,
  distinct_id AS user_id,
  timestamp AS event_timestamp,
  json_extract_string(properties, '$.genre') AS genre,
  json_extract_string(properties, '$.track_id') AS track_id,
  json_extract_string(properties, '$.wod_name') AS wod_name,
  TRY_CAST(json_extract_string(properties, '$.elapsed_ms') AS INTEGER) AS elapsed_ms,
  TRY_CAST(json_extract_string(properties, '$.track_count') AS INTEGER) AS track_count,
  TRY_CAST(json_extract_string(properties, '$.phase_count') AS INTEGER) AS phase_count,
  json_extract_string(properties, '$.error_type') AS error_type,
  TRY_CAST(json_extract_string(properties, '$.status_code') AS INTEGER) AS status_code,
  json_extract_string(properties, '$.input_mode') AS input_mode,
  CAST(json_extract_string(properties, '$.has_image') AS BOOLEAN) AS has_image,
  json_extract_string(properties, '$.playlist_id') AS playlist_id
FROM raw_events;
