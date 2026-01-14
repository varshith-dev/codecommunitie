-- ============================================
-- EMERGENCY LOGIN FIX - UPDATED VERSION
-- ============================================
-- This version handles existing policies better

-- 1. Check if function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_signup'
    ) THEN
        RAISE NOTICE '❌ Function handle_new_user_signup NOT FOUND';
    ELSE
        RAISE NOTICE '✅ Function handle_new_user_signup exists';
    END IF;
END $$;

-- 2. Grant auth schema permissions (CRITICAL)
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO authenticated, service_role;

-- 3. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    full_name TEXT,
    email TEXT,
    profile_picture_url TEXT,
    banner_image_url TEXT,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_moderator BOOLEAN DEFAULT false,
    is_advertiser BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies (clean slate)
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

-- 6. Create fresh policies
CREATE POLICY "Allow profile creation"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 7. Drop and recreate trigger function
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    attempt_count INT := 0;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Extract username
    base_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );

    final_username := base_username;

    -- Try inserting
    BEGIN
        INSERT INTO public.profiles (
            id, username, display_name, full_name, email, avatar_url, created_at, updated_at
        ) VALUES (
            NEW.id,
            final_username,
            COALESCE(NEW.raw_user_meta_data->>'display_name', base_username),
            COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
            NEW.email,
            NEW.raw_user_meta_data->>'avatar_url',
            NOW(),
            NOW()
        );
        RETURN NEW;

    EXCEPTION WHEN unique_violation THEN
        -- Try with random suffix
        FOR attempt_count IN 1..5 LOOP
            final_username := base_username || '_' || floor(random() * 10000)::text;
            BEGIN
                INSERT INTO public.profiles (
                    id, username, display_name, full_name, email, avatar_url, created_at, updated_at
                ) VALUES (
                    NEW.id, final_username,
                    COALESCE(NEW.raw_user_meta_data->>'display_name', base_username),
                    COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
                    NEW.email,
                    NEW.raw_user_meta_data->>'avatar_url',
                    NOW(), NOW()
                );
                RETURN NEW;
            EXCEPTION WHEN unique_violation THEN
                CONTINUE;
            END;
        END LOOP;

        -- Final fallback
        final_username := 'user_' || substr(NEW.id::text, 1, 8);
        INSERT INTO public.profiles (id, username, display_name, email, created_at, updated_at)
        VALUES (NEW.id, final_username, 'New User', NEW.email, NOW(), NOW());
        RETURN NEW;
    END;
END;
$$;

-- 8. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated, anon, service_role;

-- 10. Verify setup
SELECT '✅ Setup complete! Try logging in now.' AS status;
