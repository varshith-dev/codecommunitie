-- ULTIMATE SIGNUP FIX v3 🛡️
-- Run this in Supabase SQL Editor

-- 1. Ensure Profiles Table Exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Grant Permissions (Fixes "Permission Denied")
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated, anon;

-- 3. DROP ALL OLD TRIGGERS (Aggressive Cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_old ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_v2 ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 4. CREATE NEW HANDLER FUNCTION (v3 to avoid conflict)
CREATE OR REPLACE FUNCTION public.handle_new_user_v3() 
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  pf_exists boolean;
BEGIN
  -- Basic username derivation
  base_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  final_username := base_username;

  -- Idempotency Check
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RETURN new;
  END IF;

  BEGIN
    -- ATTEMPT 1: Primary Insert
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      new.id,
      final_username,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
      new.raw_user_meta_data->>'avatar_url'
    );
  EXCEPTION WHEN unique_violation THEN
     -- ATTEMPT 2: Collision Fallback
     final_username := base_username || '_' || floor(random() * 10000)::text;
     
     INSERT INTO public.profiles (id, username, full_name, avatar_url)
     VALUES (
        new.id,
        final_username,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
        new.raw_user_meta_data->>'avatar_url'
     )
     ON CONFLICT (id) DO NOTHING;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. BIND NEW TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_v3();

-- 6. CONFIRMATION
SELECT 'Fix Applied Successfully' as status;
