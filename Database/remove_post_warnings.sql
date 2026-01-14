-- ========================================
-- REMOVE OLD WARNING FLAGS FROM POSTS
-- ========================================
-- Clears warning flags from old media review system

-- Option 1: Remove all warnings from all posts
UPDATE posts
SET media_warning = false,
    requires_review = false
WHERE media_warning = true OR requires_review = true;

-- Option 2: Remove warnings from specific posts (if you want to be selective)
-- Replace 'POST_ID_HERE' with actual post IDs
/*
UPDATE posts
SET media_warning = false,
    requires_review = false
WHERE id IN ('POST_ID_1', 'POST_ID_2', 'POST_ID_3');
*/

-- Check which posts had warnings
SELECT id, title, media_warning, requires_review, created_at
FROM posts
WHERE media_warning = true OR requires_review = true;

-- After running the update, verify they're cleared
SELECT COUNT(*) as posts_with_warnings
FROM posts
WHERE media_warning = true OR requires_review = true;
