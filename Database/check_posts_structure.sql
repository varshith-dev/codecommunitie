-- ========================================
-- FIND POSTS TABLE STRUCTURE
-- ========================================
-- First, let's see what columns exist in posts table

-- View all columns in posts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Check if there's a status or flag column
SELECT *
FROM posts
LIMIT 1;

-- Look for posts that might have warnings
-- Common column names could be: status, flag, is_flagged, content_warning, etc.
SELECT id, title, created_at
FROM posts
WHERE created_at > NOW() - INTERVAL '30 days'
LIMIT 10;
