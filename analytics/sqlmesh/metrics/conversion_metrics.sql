METRIC (
  name export_conversion_rate,
  owner data_team,
  expression COUNT(DISTINCT crank.fct_generations.generation_id) FILTER (WHERE crank.fct_generations.has_spotify = TRUE) / NULLIF(COUNT(DISTINCT crank.fct_generations.generation_id), 0),
  description 'Rate of generations that result in Spotify export'
);
