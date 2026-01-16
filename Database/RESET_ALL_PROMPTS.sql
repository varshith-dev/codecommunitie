-- NUCLEAR OPTION: Delete ALL user prompts to reset the counter
-- This will fix the "1 / 42" issue immediately.

DELETE FROM public.user_prompts;

-- If you want to delete ONLY the "Complete Your Profile" ones:
-- DELETE FROM public.user_prompts WHERE title ILIKE '%Complete Your Profile%';
