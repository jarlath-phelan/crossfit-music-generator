AUDIT (
  name assert_valid_genre,
  model crank.fct_generations,
  description 'Ensure genre values are from the expected set'
);

SELECT *
FROM crank.fct_generations
WHERE genre NOT IN ('Rock', 'Hip-Hop', 'EDM', 'Metal', 'Pop', 'Punk', 'Country', 'Indie');
