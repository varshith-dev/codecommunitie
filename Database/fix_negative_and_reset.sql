-- Fix Negative Balance Issues
CREATE OR REPLACE FUNCTION track_ad_impression_secure(target_ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    viewer_id UUID;
    impression_count INTEGER;
    cpm_cost NUMERIC;
    advertiser_id UUID;
    campaign_id UUID;
    current_credits NUMERIC;
BEGIN
    viewer_id := auth.uid();
    
    SELECT c.advertiser_id, a.campaign_id 
    INTO advertiser_id, campaign_id
    FROM advertisements a
    JOIN ad_campaigns c ON a.campaign_id = c.id
    WHERE a.id = target_ad_id;

    IF NOT FOUND THEN RETURN; END IF;

    -- Check if advertiser has credits
    SELECT ad_credits INTO current_credits FROM profiles WHERE id = advertiser_id;
    IF current_credits <= 0 THEN RETURN; END IF;

    SELECT COUNT(*) INTO impression_count
    FROM ad_impressions
    WHERE ad_id = target_ad_id AND user_id = viewer_id;

    IF impression_count >= 10 THEN
        RETURN; 
    END IF;

    INSERT INTO ad_impressions (ad_id, user_id)
    VALUES (target_ad_id, viewer_id);

    UPDATE advertisements 
    SET impressions = impressions + 1 
    WHERE id = target_ad_id;

    SELECT cpm_rate INTO cpm_cost FROM ad_settings LIMIT 1;
    
    -- Prevent negative balance
    UPDATE profiles
    SET ad_credits = GREATEST(0, ad_credits - (cpm_cost / 1000))
    WHERE id = advertiser_id;

    UPDATE ad_campaigns
    SET spent = spent + (cpm_cost / 1000)
    WHERE id = campaign_id;
    
END;
$$;

CREATE OR REPLACE FUNCTION track_ad_click_secure(target_ad_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    viewer_id UUID;
    click_count INTEGER;
    cpc_cost NUMERIC;
    advertiser_id UUID;
    campaign_id UUID;
    current_credits NUMERIC;
BEGIN
    viewer_id := auth.uid();

    SELECT c.advertiser_id, a.campaign_id 
    INTO advertiser_id, campaign_id
    FROM advertisements a
    JOIN ad_campaigns c ON a.campaign_id = c.id
    WHERE a.id = target_ad_id;

    IF NOT FOUND THEN RETURN; END IF;

    -- Check if advertiser has credits
    SELECT ad_credits INTO current_credits FROM profiles WHERE id = advertiser_id;
    IF current_credits <= 0 THEN RETURN; END IF;

    SELECT COUNT(*) INTO click_count
    FROM ad_clicks
    WHERE ad_id = target_ad_id AND user_id = viewer_id;

    IF click_count >= 2 THEN
        RETURN; 
    END IF;

    INSERT INTO ad_clicks (ad_id, user_id)
    VALUES (target_ad_id, viewer_id);

    UPDATE advertisements 
    SET clicks = clicks + 1 
    WHERE id = target_ad_id;

    SELECT cpc_rate INTO cpc_cost FROM ad_settings LIMIT 1;
    
    -- Prevent negative balance
    UPDATE profiles
    SET ad_credits = GREATEST(0, ad_credits - cpc_cost)
    WHERE id = advertiser_id;

    UPDATE ad_campaigns
    SET spent = spent + cpc_cost
    WHERE id = campaign_id;

END;
$$;

-- Admin: Reset Advertiser History (wipe all data for a specific user)
CREATE OR REPLACE FUNCTION admin_reset_advertiser_history(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if executor is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Delete Ad Metrics (Impressions/Clicks) by cascading from advertisements?
    -- Schema usually cascades. If not, manual delete:
    -- DELETE FROM ad_impressions WHERE ad_id IN (SELECT id FROM advertisements WHERE campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = target_user_id));
    -- DELETE FROM ad_clicks WHERE ad_id IN (SELECT id FROM advertisements WHERE campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = target_user_id));
    
    -- Delete Advertisements (should cascade metrics)
    DELETE FROM advertisements 
    WHERE campaign_id IN (SELECT id FROM ad_campaigns WHERE advertiser_id = target_user_id);

    -- Delete Campaigns
    DELETE FROM ad_campaigns 
    WHERE advertiser_id = target_user_id;

    -- Reset Credits and other user stats if needed
    UPDATE profiles 
    SET ad_credits = 0
    WHERE id = target_user_id;

    -- Optionally clear transaction logs?
    DELETE FROM ad_credit_requests WHERE advertiser_id = target_user_id;
    -- DELETE FROM email_logs WHERE recipient_email ... (maybe keep email logs)
END;
$$;
