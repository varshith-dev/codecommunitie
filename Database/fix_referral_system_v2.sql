-- 1. Fix RLS to allow Admins AND Beta Users (in user_feature_access) to create referrals
DROP POLICY IF EXISTS "Users with access can create referrals" ON referrals;

CREATE POLICY "Users with access can create referrals" ON referrals
    FOR INSERT WITH CHECK (
        referrer_id = auth.uid() AND (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_refer = true) OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
            EXISTS (SELECT 1 FROM user_feature_access WHERE user_id = auth.uid() AND feature_id = 'referrals')
        )
    );

-- 2. Allow admins/owners to view referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Create incremental function for referral stats (if not exists)
CREATE OR REPLACE FUNCTION increment_referral_uses(referral_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE referrals
  SET uses_count = uses_count + 1
  WHERE id = referral_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
