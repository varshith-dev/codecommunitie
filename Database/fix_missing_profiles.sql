-- ================================================================
-- COMPREHENSIVE FIX: User Visibility Issue
-- ================================================================
-- This fixes the issue where User 1 sees profiles correctly
-- but User 2 sees "Anonymous"
-- ================================================================

-- STEP 1: Check current state
SELECT 
  u.email,
  p.username,
  p.display_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.username IS NULL OR p.username = '' THEN '⚠️ NULL USERNAME'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- STEP 2: Create profiles for users without them
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  u.id, 
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(u.email, '@', 1),
    'user_' || substring(u.id::text, 1, 8)
  ) as username,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1)
  ) as display_name
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

-- STEP 3: Fix NULL or empty usernames
UPDATE public.profiles p
SET username = COALESCE(
  NULLIF(username, ''),
  (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p.id),
  'user_' || substring(p.id::text, 1, 8)
)
WHERE username IS NULL OR username = '';

-- STEP 4: Ensure RLS policy allows public reads
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  TO public
  USING (true);

-- STEP 5: Verify - all should show ✅
SELECT 
  u.email,
  p.username,
  p.display_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING'
    WHEN p.username IS NULL OR p.username = '' THEN '⚠️ NULL'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
