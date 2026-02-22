METRIC (
  name daily_active_users,
  owner data_team,
  expression COUNT(DISTINCT crank.fct_playback.user_id),
  description 'Users with at least one playback event'
);

METRIC (
  name track_sentiment,
  owner data_team,
  expression SUM(CASE WHEN crank.dim_tracks.net_sentiment > 0 THEN 1 ELSE -1 END),
  description 'Overall track sentiment score'
);
