-- Add columns for Tag Management
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS feature_label TEXT,
ADD COLUMN IF NOT EXISTS feature_order INT DEFAULT 0;

-- Update get_trending_tags function to respect featured tags
DROP FUNCTION IF EXISTS get_trending_tags;
CREATE OR REPLACE FUNCTION get_trending_tags(limit_count INT DEFAULT 5)
RETURNS TABLE (id BIGINT, name TEXT, slug TEXT, post_count BIGINT, is_featured BOOLEAN, feature_label TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, 
    t.name, 
    t.slug, 
    COUNT(pt.post_id) as post_count,
    t.is_featured,
    t.feature_label
  FROM tags t
  LEFT JOIN post_tags pt ON t.id = pt.tag_id
  GROUP BY t.id, t.name, t.slug, t.is_featured, t.feature_label, t.feature_order
  ORDER BY 
    t.is_featured DESC, -- Featured tags first
    t.feature_order ASC, -- Then by manual order
    post_count DESC -- Then by popularity
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
