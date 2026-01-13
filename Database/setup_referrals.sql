-- Referrals System Schema

-- 1. Create Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Referral Uses Audit Table
CREATE TABLE IF NOT EXISTS public.referral_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(referral_id, referred_user_id)
);

-- 3. Add column to Profiles if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN 
        ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id); 
    END IF; 
END $$;

-- 4. RPC Function to Register Referral (Security Definer to bypass RLS for new users)
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

-- 5. RLS Policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own referrals
CREATE POLICY "Users can view own referral code" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

-- Allow users to create their own referral code
CREATE POLICY "Users can create own referral code" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Allow users to view who they referred
CREATE POLICY "Users can view their referred users" ON public.referral_uses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.referrals 
            WHERE referrals.id = referral_uses.referral_id 
            AND referrals.referrer_id = auth.uid()
        )
    );
