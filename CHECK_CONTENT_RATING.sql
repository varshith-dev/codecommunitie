-- Simple check: Does content_rating column exist?
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'content_rating'
) as column_exists;

-- If false, run this to add it:
-- ALTER TABLE public.posts ADD COLUMN content_rating TEXT DEFAULT 'unreviewed';
