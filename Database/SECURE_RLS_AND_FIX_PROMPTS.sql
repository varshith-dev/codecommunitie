-- SECURITY UPDATE: RLS & Email Verification Enforcement

-- 1. Helper Function: Check if user's email is verified
-- usage: is_email_verified()
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS BOOLEAN AS $$
DECLARE
  is_confirmed BOOLEAN;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL) INTO is_confirmed
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_confirmed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix 'user_prompts' RLS (Fixes Console Errors)
-- The automation service (client-side) inserts records into this table.
-- We need to allow users to insert rows for *themselves*.

ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own prompts" ON public.user_prompts;
CREATE POLICY "Users can insert their own prompts"
ON public.user_prompts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own prompts" ON public.user_prompts;
CREATE POLICY "Users can view their own prompts"
ON public.user_prompts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own prompts" ON public.user_prompts;
CREATE POLICY "Users can update their own prompts"
ON public.user_prompts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());


-- 3. Enforce Email Verification on Critical Tables (The "SQL Side" Request)
-- Prevent unverified users from Posting, Commenting, or Liking.

-- POSTS
DROP POLICY IF EXISTS "Verified users can create posts" ON public.posts;
CREATE POLICY "Verified users can create posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_email_verified() = true
);

-- COMMENTS
DROP POLICY IF EXISTS "Verified users can create comments" ON public.comments;
CREATE POLICY "Verified users can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_email_verified() = true
);

-- LIKES
DROP POLICY IF EXISTS "Verified users can like" ON public.likes;
CREATE POLICY "Verified users can like"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_email_verified() = true
);

-- FOLLOWS
DROP POLICY IF EXISTS "Verified users can follow" ON public.follows;
CREATE POLICY "Verified users can follow"
ON public.follows
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = follower_id 
  AND public.is_email_verified() = true
);
