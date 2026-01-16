-- SQL to Clean Up "Deleted" Accounts (Orphaned Auth Users)
-- This deletes users from auth.users who do not have a corresponding profile in public.profiles.
-- Use this if users deleted their account via the UI (profile delete) but the Auth User remains.

-- 1. Check how many orphaned users exist (Safe to run)
SELECT count(*) as orphaned_users_count 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. View details of orphaned users (Optional)
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 3. DELETE orphaned users (Run this to fix the issue)
-- CAUTION: This permanently deletes these logins.
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);
