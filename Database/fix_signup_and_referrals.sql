-- MASTER FIX SCRIPT for Signup & Referrals
-- Usage: Run this in Supabase SQL Editor

-- 1. FIX: Drop conflicting policies first to avoid "Policy already exists" errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own referral code" ON public.referrals;
DROP POLICY IF EXISTS "Users can create own referral code" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their referred users" ON public.referral_uses;

-- 2. FIX: Ensure Profiles Table Exists and has columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  -- Add referral column if missing
  referred_by UUID REFERENCES public.profiles(id)
);

-- Ensure column exists (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN 
        ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id); 
    END IF; 
END $$;

-- 3. FIX: Create Robust Profile Creation Trigger (The Core Fix for "Database Error")
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevents crash if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to ensure clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. FIX: RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. FIX: Referrals System (Re-run setup to be safe)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 999999, -- Unlimited default
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referral_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(referral_id, referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

-- Re-create Policies
CREATE POLICY "Users can view own referral code" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create own referral code" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view their referred users" ON public.referral_uses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referrals.id = referral_uses.referral_id 
            AND referrals.referrer_id = auth.uid()
        )
    );

-- 6. RPC: Register Referral (Updated to be conflict-safe)
CREATE OR REPLACE FUNCTION register_referral(referral_code_input TEXT, new_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    ref_record RECORD;
BEGIN
    -- Find the referral by code
    SELECT * INTO ref_record FROM referrals WHERE referral_code = referral_code_input AND is_active = true LIMIT 1;

    IF ref_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive referral code');
    END IF;

    -- Update the new user's profile
    UPDATE profiles 
    SET referred_by = ref_record.referrer_id 
    WHERE id = new_user_id;

    -- Insert into referral_uses
    INSERT INTO referral_uses (referral_id, referred_user_id)
    VALUES (ref_record.id, new_user_id)
    ON CONFLICT (referral_id, referred_user_id) DO NOTHING;

    -- Increment usage count
    UPDATE referrals
    SET uses_count = uses_count + 1
    WHERE id = ref_record.id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
