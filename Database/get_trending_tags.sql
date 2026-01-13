-- Function to get trending tags based on usage count
-- Drops existing function if needed
DROP FUNCTION IF EXISTS get_trending_tags;

CREATE OR REPLACE FUNCTION get_trending_tags(limit_count INT DEFAULT 5)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  slug TEXT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.slug,
    COUNT(pt.post_id) as post_count
  FROM tags t
  JOIN post_tags pt ON t.id = pt.tag_id
  GROUP BY t.id, t.name, t.slug
  ORDER BY post_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
