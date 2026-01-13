-- FINAL ADMIN FIX: Run this in Supabase SQL Editor
-- This script ensures all necessary columns exist and permissions are open for the Admin panel.

-- 1. Ensure 'is_verified' and 'role' exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure columns exist on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. DISABLE RLS Policy (Simplest fix for Admins in development)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.profiles TO authenticated, anon;

GRANT ALL ON public.posts TO postgres, service_role;
GRANT ALL ON public.posts TO authenticated, anon;

GRANT ALL ON public.tags TO postgres, service_role;
GRANT ALL ON public.tags TO authenticated, anon;

-- 5. Fix Foreign Key relationships
-- Ensure posts.user_id references profiles.id
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_fkey') THEN
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;
