-- ================================================================
-- CRITICAL FIX: Create Profiles for Users Without Them
-- ================================================================
-- This script addresses the "Anonymous" user display issue
-- Run this in your Supabase SQL Editor NOW
-- ================================================================

-- Step 1: Create profiles for any users who don't have one
-- (Removed created_at from the insert as it's auto-generated)
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'display_name') as display_name
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update any profiles that have NULL usernames
UPDATE public.profiles
SET username = split_part(
  (SELECT email FROM auth.users WHERE id = profiles.id), 
  '@', 
  1
)
WHERE username IS NULL OR username = '';

-- Step 3: Verify all users now have profiles
SELECT 
  u.id as user_id,
  u.email,
  p.username,
  p.display_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE' 
    WHEN p.username IS NULL THEN '⚠️  NULL USERNAME'
    ELSE '✅ OK' 
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Expected result: All users should have status = '✅ OK'
