-- Function to safely record referral usage (works even if user is not fully logged in/verified yet)
CREATE OR REPLACE FUNCTION register_referral(referral_code_input TEXT, new_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    ref_record RECORD;
BEGIN
    -- Find the referral by code (case insensitive logic if needed, currently exact match)
    SELECT * INTO ref_record FROM referrals WHERE referral_code = referral_code_input LIMIT 1;

    IF ref_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    -- Update the new user's profile to mark who referred them
    UPDATE profiles 
    SET referred_by = ref_record.referrer_id 
    WHERE id = new_user_id;

    -- Insert into referral_uses (ignore if duplicate)
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
