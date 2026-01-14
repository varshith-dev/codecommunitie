-- NUCLEAR FIX for Signup "Database Error" ☢️
-- Run this in Supabase SQL Editor to clean up ALL old triggers and fix the collision issue once and for all.

-- 1. DROP ALL POTENTIAL TRIGGERS (Cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_old ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 2. CREATE ROBUST FUNCTION (With Collision Handling)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  pf_exists boolean;
BEGIN
  -- Basic username derivation
  base_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  final_username := base_username;

  -- CHECK IF PROFILE ALREADY EXISTS (Idempotency)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) INTO pf_exists;
  
  IF pf_exists THEN
    RETURN new; -- Exit if profile exists
  END IF;

  BEGIN
    -- ATTEMPT 1: Insert with preferred username
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      new.id,
      final_username,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
      new.raw_user_meta_data->>'avatar_url'
    );
  EXCEPTION WHEN unique_violation THEN
     -- ATTEMPT 2: Append random suffix
     final_username := base_username || '_' || substr(md5(random()::text), 1, 4);
     
     BEGIN
        INSERT INTO public.profiles (id, username, full_name, avatar_url)
        VALUES (
            new.id,
            final_username,
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
            new.raw_user_meta_data->>'avatar_url'
        );
     EXCEPTION WHEN OTHERS THEN
        -- FINAL FALLBACK: If even that fails, use UUID as username
        final_username := 'user_' || substr(new.id::text, 1, 8);
        INSERT INTO public.profiles (id, username, full_name, avatar_url)
        VALUES (
            new.id,
            final_username,
            'Unknown User',
            ''
        );
     END;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-BIND TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. VERIFY PERMISSIONS (Just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
