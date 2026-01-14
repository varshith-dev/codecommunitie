-- =========================================================
-- FINAL CLEANUP SCRIPT (ROBUST VERSION)
-- =========================================================

-- 1. KILL THE BROKEN TRIGGER (Stops "Database error granting user")
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

-- 2. NUKE ALL EXISTING POLICIES ON PROFILES (To fix "policy already exists" error)
-- This block loops through every policy on 'profiles' and deletes it.
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- 3. ENABLE RLS (Safety Check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREATE FRESH POLICIES (Now guaranteed to succeed)
CREATE POLICY "Public Read Access" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "User Create Own Profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "User Update Own Profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. GRANT ADMIN ACCESS
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email IN ('varshith.code@gmail.com', 'varshithtillu08@gmail.com');

-- 6. CONFIRMATION
SELECT '✅ SUCCESS: Old policies cleared, trigger removed, and admin access granted.' as status;
