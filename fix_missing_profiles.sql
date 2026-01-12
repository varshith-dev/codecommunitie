-- ================================================
-- FIX: Ensure All Users Have Profiles
-- ================================================
-- This script creates profiles for users who don't have one
-- Run this in your Supabase SQL Editor

-- Create profiles for users without them
INSERT INTO public.profiles (id, username)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Verify all users now have profiles
SELECT 
  u.id as user_id,
  u.email,
  p.username,
  p.display_name,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Expected result: All users should have profile_status = 'EXISTS'
