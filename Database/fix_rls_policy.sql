-- ============================================
-- PROFILE UPLOAD FIX - Alternative Approach
-- ============================================
-- Run this if the previous SQL gave an error

-- First, check what policies currently exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Drop ALL existing policies for profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END $$;

-- Create new comprehensive policy
CREATE POLICY "Users can manage their own profile" 
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify it worked
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================
-- Your profile uploads should now work!
-- ============================================
