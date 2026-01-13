-- PRODUCTION-READY RLS POLICIES (Non-Recursive)
-- Run this when you're ready to re-enable security
-- This avoids infinite recursion by using a helper function

-- Step 1: Create a helper function to check admin status
-- This function is SECURITY DEFINER, so it runs with elevated privileges
-- and doesn't trigger RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
    AND (is_admin = true OR role = 'admin')
  );
$$;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "tags_select_all" ON public.tags;
DROP POLICY IF EXISTS "tags_all_admin" ON public.tags;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_admin" ON public.profiles;

-- Step 3: Create non-recursive policies using the helper function

-- TAGS TABLE
CREATE POLICY "tags_select_all" 
ON public.tags FOR SELECT 
USING (true);

CREATE POLICY "tags_insert_admin" 
ON public.tags FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "tags_update_admin" 
ON public.tags FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "tags_delete_admin" 
ON public.tags FOR DELETE 
USING (public.is_admin(auth.uid()));

-- PROFILES TABLE
CREATE POLICY "profiles_select_all" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "profiles_update_own" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" 
ON public.profiles FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- POSTS TABLE
CREATE POLICY "posts_select_published" 
ON public.posts FOR SELECT 
USING (
  status = 'published' 
  OR user_id = auth.uid() 
  OR public.is_admin(auth.uid())
);

CREATE POLICY "posts_insert_own" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" 
ON public.posts FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "posts_delete_own_or_admin" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Step 4: Re-enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT 'RLS Policies Created Successfully' as status;
