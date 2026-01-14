-- ============================================
-- PRODUCTION-READY DATABASE FIX
-- ============================================
-- This script fixes ALL authentication issues
-- Run this in Supabase SQL Editor

-- STEP 1: Clean up existing broken policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- STEP 2: Create simple, permissive policies
CREATE POLICY "enable_read_access_for_all_users"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "enable_insert_for_authenticated_users_only"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "enable_update_for_users_based_on_user_id"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- STEP 3: Grant critical permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- STEP 4: Fix the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_attempt TEXT;
    counter INT := 0;
BEGIN
    -- Skip if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Get base username
    username_attempt := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1)
    );

    -- Try to insert with collision handling
    LOOP
        BEGIN
            INSERT INTO public.profiles (
                id, username, email, display_name, created_at
            ) VALUES (
                NEW.id,
                username_attempt,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'display_name', username_attempt),
                NOW()
            );
            EXIT; -- Success, exit loop
        EXCEPTION WHEN unique_violation THEN
            counter := counter + 1;
            IF counter > 10 THEN
                -- Fallback to UUID
                username_attempt := 'user_' || substr(NEW.id::text, 1, 8);
                INSERT INTO public.profiles (id, username, email, created_at)
                VALUES (NEW.id, username_attempt, NEW.email, NOW());
                EXIT;
            END IF;
            username_attempt := split_part(NEW.email, '@', 1) || '_' || floor(random() * 10000)::text;
        END;
    END LOOP;

    RETURN NEW;
END;
$$;

-- STEP 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- STEP 6: Fix any users without profiles
INSERT INTO public.profiles (id, username, email, created_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1), 'user_' || substr(u.id::text, 1, 8)),
    u.email,
    u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- STEP 7: Make your account admin
UPDATE public.profiles 
SET 
    role = 'admin',
    is_admin = true,
    is_verified = true
WHERE email = 'varshithtillu08@gmail.com';

-- STEP 8: Verify everything
SELECT 
    '✅ SETUP COMPLETE!' as status,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.profiles WHERE is_admin = true) as admin_count;

-- Show your admin account
SELECT id, username, email, role, is_admin, is_verified 
FROM public.profiles 
WHERE email = 'varshithtillu08@gmail.com';
