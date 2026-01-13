-- Allow admins to create referrals regardless of can_refer
DROP POLICY IF EXISTS "Users with access can create referrals" ON referrals;

CREATE POLICY "Users with access can create referrals" ON referrals
    FOR INSERT WITH CHECK (
        referrer_id = auth.uid() AND (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_refer = true) OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    );

-- Also ensure we can select if admin
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
