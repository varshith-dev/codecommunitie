-- STOP THE LOOP / SPAM FOREVER
-- This script adds a constraint so you CANNOT have duplicates in the database.

-- 1. Clean up existing duplicates (Keep latest)
DELETE FROM public.user_prompts a USING (
  SELECT min(ctid) as ctid, user_id, title
  FROM public.user_prompts 
  WHERE is_dismissed = false
  GROUP BY user_id, title HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id 
AND a.title = b.title 
AND a.is_dismissed = false
AND a.ctid <> b.ctid;

-- 2. Add Unique Index (The "Active Prompt" Lock)
-- This ensures a user can only have ONE (1) active prompt with a given title.
DROP INDEX IF EXISTS idx_unique_active_user_prompts;
CREATE UNIQUE INDEX idx_unique_active_user_prompts 
ON public.user_prompts (user_id, title) 
WHERE is_dismissed = false;
