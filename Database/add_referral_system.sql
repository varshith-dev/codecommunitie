-- Referral system with beta access control
-- Only specific users can access the referral feature

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    uses_count INT DEFAULT 0,
    max_uses INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referral uses tracking
CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referral_id, referred_user_id)
);

-- Add beta access columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_refer BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (referrer_id = auth.uid());

DROP POLICY IF EXISTS "Users with access can create referrals" ON referrals;
CREATE POLICY "Users with access can create referrals" ON referrals
    FOR INSERT WITH CHECK (
        referrer_id = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_refer = true)
    );

-- RLS Policies for referral_uses
DROP POLICY IF EXISTS "Users can view their referral uses" ON referral_uses;
CREATE POLICY "Users can view their referral uses" ON referral_uses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM referrals WHERE id = referral_id AND referrer_id = auth.uid())
    );

-- Public policy to use a referral code
DROP POLICY IF EXISTS "Anyone can use a referral" ON referral_uses;
CREATE POLICY "Anyone can use a referral" ON referral_uses
    FOR INSERT WITH CHECK (referred_user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    username TEXT;
BEGIN
    SELECT p.username INTO username FROM profiles p WHERE p.id = user_id;
    code := UPPER(SUBSTRING(username FROM 1 FOR 4)) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    RETURN code;
END;
$$ LANGUAGE plpgsql;
