METRIC (
  name daily_generations,
  owner data_team,
  expression COUNT(crank.fct_generations.generation_id),
  description 'Total playlist generations per day'
);

METRIC (
  name unique_generators,
  owner data_team,
  expression COUNT(DISTINCT crank.fct_generations.user_id),
  description 'Unique users who generated a playlist'
);

METRIC (
  name generations_per_user,
  owner data_team,
  expression @daily_generations / NULLIF(@unique_generators, 0),
  description 'Average generations per unique user'
);

METRIC (
  name avg_generation_latency,
  owner data_team,
  expression AVG(crank.fct_generations.elapsed_ms),
  description 'Average time to generate a playlist in milliseconds'
);
