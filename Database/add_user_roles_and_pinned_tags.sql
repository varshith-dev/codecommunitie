-- Add advertiser role and pinned tags functionality

-- 1. Add is_pinned and pin_order to tags table
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS pin_order INT DEFAULT 0;

-- 2. Create index for pinned tags
CREATE INDEX IF NOT EXISTS idx_tags_pinned ON public.tags(is_pinned, pin_order) WHERE is_pinned = TRUE;

-- 3. Update get_trending_tags function to show pinned tags first
DROP FUNCTION IF EXISTS get_trending_tags(INT);
CREATE OR REPLACE FUNCTION get_trending_tags(limit_count INT DEFAULT 5)
RETURNS TABLE (
    id BIGINT, 
    name TEXT, 
    slug TEXT, 
    post_count BIGINT, 
    is_featured BOOLEAN, 
    feature_label TEXT,
    is_pinned BOOLEAN,
    pin_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, 
    t.name, 
    t.slug, 
    COUNT(pt.post_id) as post_count,
    t.is_featured,
    t.feature_label,
    t.is_pinned,
    t.pin_order
  FROM tags t
  LEFT JOIN post_tags pt ON t.id = pt.tag_id
  GROUP BY t.id, t.name, t.slug, t.is_featured, t.feature_label, t.feature_order, t.is_pinned, t.pin_order
  ORDER BY 
    t.is_pinned DESC,        -- Pinned tags first
    t.pin_order ASC,         -- Then by pin order
    t.is_featured DESC,      -- Then featured tags
    t.feature_order ASC,     -- Then by feature order
    post_count DESC          -- Finally by popularity
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant permissions for tag pinning (admins only via existing RLS)
-- The existing "Admins can manage tags" policy covers this

-- Verify changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tags' 
AND column_name IN ('is_pinned', 'pin_order');
