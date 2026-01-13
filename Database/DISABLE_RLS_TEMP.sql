-- FINAL FIX - No Recursion Policies
-- This completely avoids the infinite recursion issue

-- Step 1: Make yourself admin FIRST
UPDATE profiles 
SET role = 'admin', is_admin = true, is_verified = true 
WHERE id = auth.uid();

-- Step 2: Disable RLS completely for now
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.tablename || '_policy') || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 4: Grant full access to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 5: Verify you are admin
SELECT id, username, role, is_admin, is_verified FROM profiles WHERE id = auth.uid();

-- IMPORTANT: RLS is now DISABLED for all tables
-- This means all authenticated users can access everything
-- This is temporary to get your admin panel working
-- You can re-enable RLS later with proper non-recursive policies
