-- SIMPLE FIX: Create profile without created_at column
-- This works with the OLD database schema

-- Create profiles for all users who don't have one
INSERT INTO public.profiles (id, username)
SELECT 
  id,
  split_part(email, '@', 1) as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verify it worked
SELECT * FROM public.profiles;
