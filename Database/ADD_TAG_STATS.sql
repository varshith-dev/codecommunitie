-- Add statistics columns to tags table
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Create a function to recalculate these stats
CREATE OR REPLACE FUNCTION recalc_tag_stats()
RETURNS void AS $$
BEGIN
    -- Update post_count and last_activity
    UPDATE public.tags t
    SET 
        post_count = (
            SELECT COUNT(*) 
            FROM post_tags pt 
            WHERE pt.tag_id = t.id
        ),
        last_activity = (
            SELECT MAX(p.created_at)
            FROM post_tags pt
            JOIN posts p ON pt.post_id = p.id
            WHERE pt.tag_id = t.id
        );
        
    -- Handle case where no posts exist for a tag (null last_activity -> keep as now or null?)
    -- Setting nulls to NOW() or a default might be confusing. 
    -- Let's leave nulls valid if no activity.
END;
$$ LANGUAGE plpgsql;

-- Run it once initially
SELECT recalc_tag_stats();
