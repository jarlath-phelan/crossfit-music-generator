AUDIT (
  name assert_unique_generation_id,
  model crank.fct_generations,
  description 'Ensure generation_id is unique'
);

SELECT generation_id
FROM crank.fct_generations
GROUP BY generation_id
HAVING COUNT(*) > 1;
