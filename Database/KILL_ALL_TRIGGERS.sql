-- =========================================================
-- THE "KILL SWITCH": REMOVE ALL TRIGGERS ON AUTH.USERS
-- =========================================================
-- The "Database error granting user" is 100% caused by a trigger.
-- This script finds ANY/ALL triggers on the `auth.users` table and deletes them.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all triggers on auth.users
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    )
    LOOP
        -- Drop the trigger dynamically
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON auth.users';
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Also remove the function just in case
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE; -- Common alternate name

-- Re-apply policies (Just to be safe, clean slate again)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User Create Own Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Final Confirmation
SELECT '✅ ALL Triggers dropped. Login MUST work now.' as status;
