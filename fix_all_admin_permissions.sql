-- Comprehensive Admin Permissions Fix
-- Run this in Supabase SQL Editor to enable all admin functionality

-- ==========================================
-- 1. ENSURE ADMIN ROLE IS SET
-- ==========================================
-- First, verify you are an admin (replace with your actual user ID or email)
-- You can find your user ID in the Supabase Auth dashboard

-- Example: UPDATE profiles SET role = 'admin', is_admin = true WHERE id = 'your-user-id-here';
-- Or by email: UPDATE profiles SET role = 'admin', is_admin = true WHERE email = 'your-email@example.com';

-- ==========================================
-- 2. FIX TAGS TABLE PERMISSIONS
-- ==========================================

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Anyone can view tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can insert tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can update tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON public.tags;

-- Create new comprehensive policies
CREATE POLICY "Anyone can view tags"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tags"
ON public.tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

CREATE POLICY "Admins can update tags"
ON public.tags FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

CREATE POLICY "Admins can delete tags"
ON public.tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

-- ==========================================
-- 3. FIX PROFILES TABLE PERMISSIONS
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Recreate policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

-- ==========================================
-- 4. FIX POSTS TABLE PERMISSIONS
-- ==========================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;

CREATE POLICY "Admins can delete any post"
ON public.posts FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

-- ==========================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ==========================================

GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.posts TO authenticated;

-- ==========================================
-- 6. VERIFY YOUR ADMIN STATUS
-- ==========================================

-- Check if you are an admin (this will show your profile)
SELECT id, username, role, is_admin, is_verified
FROM profiles
WHERE id = auth.uid();

-- If the above returns NULL for role or is_admin is false, run:
-- UPDATE profiles SET role = 'admin', is_admin = true WHERE id = auth.uid();

-- ==========================================
-- 7. TEST PERMISSIONS
-- ==========================================

-- Test if you can update a tag (replace 1 with an actual tag ID)
-- UPDATE tags SET is_featured = true WHERE id = 1;

-- If the above works, permissions are fixed!
