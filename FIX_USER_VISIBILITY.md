# 🔴 Profile Display Issue - User 1 vs User 2

## The Problem (from your screenshots)

**User 1 (varshith - Author):**
- ✅ Sees own posts with correct username "varshith"
- ✅ Profile displays correctly

**User 2 (vixtruvgo - Third-party viewer):**
- ❌ Sees same posts as "Anonymous"
- ❌ Cannot see author information

## Root Cause

The profiles are being fetched, but there's likely one of these issues:

1. **Profile doesn't exist in database** for the post author
2. **Username is NULL** in the profiles table
3. **RLS policy blocking access** for non-owners

## Immediate Fix - Run This in Supabase SQL Editor

```sql
-- Step 1: Check which users are missing profiles
SELECT 
  u.id,
  u.email,
  EXISTS(SELECT 1 FROM public.profiles WHERE id = u.id) as has_profile
FROM auth.users u;

-- Step 2: Create missing profiles (if any show false above)
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  u.id, 
  COALESCE(
    u.raw_user_meta_data->>'username',
    LOWER(REPLACE(u.email, '@', '_')),
    'user_' || substring(u.id::text, 1, 8)
  ) as username,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'display_name'
  ) as display_name
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Fix NULL usernames
UPDATE public.profiles p
SET username = COALESCE(
  (SELECT LOWER(REPLACE(email, '@', '_')) FROM auth.users WHERE id = p.id),
  'user_' || substring(p.id::text, 1, 8)
)
WHERE username IS NULL OR username = '';

-- Step 4: Verify RLS policy allows public reads
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  TO public
  USING (true);

-- Step 5: Final verification - should show all users with profiles
SELECT 
  u.email,
  p.id,
  p.username,
  p.display_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.username IS NULL OR p.username = '' THEN '⚠️ NULL USERNAME'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## After Running the Script

1. **Refresh both browsers** (Ctrl+Shift+R)
2. **User 2 should now see** "varshith" instead of "Anonymous"
3. **All posts should display correctly** for all users

## If Still Not Working

Share the output of Step 5 (the verification query) - it will show which users have issues.
