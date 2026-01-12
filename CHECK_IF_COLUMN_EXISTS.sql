-- Check if content_rating column exists and has data
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('content_rating', 'reviewed_at', 'reviewed_by');

-- Check actual data
SELECT 
    id,
    title,
    content_rating,
    reviewed_at,
    reviewed_by
FROM posts
LIMIT 10;
