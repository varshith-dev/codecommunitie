-- CLEANUP SQL: Delete duplicate prompts
-- Run this to clean up the "23/24" message mess

-- 1. Mark all "Complete Your Profile" prompts as dismissed for everyone (soft cleanup)
UPDATE public.user_prompts
SET is_dismissed = true
WHERE title ILIKE '%Complete Your Profile%';

-- 2. (Optional) Hard delete duplicates, keeping only the most recent one per user per title
DELETE FROM public.user_prompts a USING (
  SELECT min(ctid) as ctid, user_id, title
  FROM public.user_prompts 
  GROUP BY user_id, title HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.title = b.title 
AND a.ctid <> b.ctid;
