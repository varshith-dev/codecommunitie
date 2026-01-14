-- ============================================
-- NUCLEAR OPTION: Complete Database Reset
-- ============================================
-- Run these ONE AT A TIME and test after each step

-- ====================
-- STEP 1: Disable RLS Temporarily
-- ====================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

SELECT 'Step 1 Complete: RLS Disabled' as status;

-- ====================
-- STEP 2: Create Profiles for Existing Auth Users
-- ====================
INSERT INTO public.profiles (id, username, email, created_at)
SELECT 
    u.id,
    split_part(u.email, '@', 1) || '_' || substr(u.id::text, 1, 4),
    u.email,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email;

SELECT 'Step 2 Complete: Created ' || count(*) || ' profiles' as status
FROM public.profiles;

-- ====================
-- STEP 3: Make Yourself Admin
-- ====================
UPDATE public.profiles 
SET 
    role = 'admin',
    is_admin = true,
    is_verified = true,
    username = COALESCE(username, 'admin')
WHERE email = 'varshithtillu08@gmail.com';

SELECT 'Step 3 Complete: Admin account created' as status,
       id, username, email, role, is_admin
FROM public.profiles 
WHERE email = 'varshithtillu08@gmail.com';

-- ====================
-- STEP 4: Test Login Now!
-- ====================
-- Go to your app and try logging in
-- If it works, the problem was RLS
-- If it still fails, there's a different issue

-- ====================
-- STEP 5: If Login Works, Recreate Simple Trigger
-- ====================
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Very simple: just create profile
    INSERT INTO public.profiles (id, username, email, created_at)
    VALUES (
        NEW.id,
        split_part(NEW.email, '@', 1),
        NEW.email,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

SELECT 'Step 5 Complete: Trigger recreated' as status;

-- ====================
-- STEP 6: Re-enable RLS with Permissive Policies
-- ====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create super permissive policies (for development)
CREATE POLICY "allow_all_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "allow_all_delete" ON public.profiles FOR DELETE USING (true);

SELECT 'Step 6 Complete: RLS re-enabled with permissive policies' as status;

-- ====================
-- FINAL VERIFICATION
-- ====================
SELECT 
    'SETUP COMPLETE' as status,
    (SELECT count(*) FROM auth.users) as auth_users,
    (SELECT count(*) FROM public.profiles) as profiles,
    (SELECT count(*) FROM public.profiles WHERE is_admin = true) as admins;
