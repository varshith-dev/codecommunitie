-- ========================================
-- REMOVE POST WARNINGS (CORRECT VERSION)
-- ========================================
-- Removes content_rating warnings from posts

-- First, check which posts have 'risk' rating
SELECT id, title, content_rating, created_at
FROM posts
WHERE content_rating = 'risk'
ORDER BY created_at DESC;

-- Remove 'risk' rating from all posts (sets to NULL or 'safe')
UPDATE posts
SET content_rating = NULL
WHERE content_rating = 'risk';

-- Alternatively, set to 'safe'
/*
UPDATE posts
SET content_rating = 'safe'
WHERE content_rating = 'risk';
*/

-- Verify removal
SELECT COUNT(*) as posts_with_risk_rating
FROM posts
WHERE content_rating = 'risk';
