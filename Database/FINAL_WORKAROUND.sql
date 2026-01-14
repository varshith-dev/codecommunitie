-- ==========================================
-- FINAL FIX: REMOVE BROKEN TRIGGER & RESET RLS
-- ==========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- This allows the Frontend to handle profile creation safely

-- 1. Remove the failing trigger (Stops "Database error granting user")
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

-- 2. Ensure Profiles Table Exists & RLS is On
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    display_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policies to Allow Frontend Insert/Select/Update
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new working policies
CREATE POLICY "Public Read Access"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "User Create Own Profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "User Update Own Profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 4. Grant Admin to Your Account
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email IN ('varshithtillu08@gmail.com', 'varshithpaladugu07@gmail.com');

-- 5. Final Confirmation
SELECT '✅ Database trigger removed and policies reset. Login should work now.' as status;
