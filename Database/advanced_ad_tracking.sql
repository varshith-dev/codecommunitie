-- Secure Ad Tracking & Billing System

-- 1. Create Tracking Tables
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for anon users (if we allowed them, but limiting requires ID)
    ip_address TEXT, -- For anon tracking if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_impressions_ad_user ON ad_impressions(ad_id, user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_ad_user ON ad_clicks(ad_id, user_id);

-- 2. Advanced Impression Tracking RPC
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
BEGIN
    viewer_id := auth.uid();
    
    -- basic validation to ensure ad exists and is valid
    SELECT c.advertiser_id, a.campaign_id 
    INTO advertiser_id, campaign_id
    FROM advertisements a
    JOIN ad_campaigns c ON a.campaign_id = c.id
    WHERE a.id = target_ad_id;

    IF NOT FOUND THEN RETURN; END IF;

    -- 1. Check Limits (Max 10 impressions per user per ad)
    SELECT COUNT(*) INTO impression_count
    FROM ad_impressions
    WHERE ad_id = target_ad_id AND user_id = viewer_id;

    IF impression_count >= 10 THEN
        RETURN; -- Ignore excess impressions
    END IF;

    -- 2. Record Impression
    INSERT INTO ad_impressions (ad_id, user_id)
    VALUES (target_ad_id, viewer_id);

    -- 3. Update Aggregate Count
    UPDATE advertisements 
    SET impressions = impressions + 1 
    WHERE id = target_ad_id;

    -- 4. Billing Logic (CPM - Cost Per Mille)
    -- Start charging only every 1000th impression? Or micro-charge?
    -- For simplicity/accuracy with credits, we can micro-charge or batch.
    -- Let's check settings.
    SELECT cpm_rate INTO cpm_cost FROM ad_settings LIMIT 1;
    -- Charge = CPM / 1000 per impression
    -- costs 0.002 credits per view if CPM is 2.00
    
    UPDATE profiles
    SET ad_credits = ad_credits - (cpm_cost / 1000)
    WHERE id = advertiser_id;

    -- Update Campaign Spend
    UPDATE ad_campaigns
    SET spent = spent + (cpm_cost / 1000)
    WHERE id = campaign_id;
    
END;
$$;

-- 3. Advanced Click Tracking RPC
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
BEGIN
    viewer_id := auth.uid();

    SELECT c.advertiser_id, a.campaign_id 
    INTO advertiser_id, campaign_id
    FROM advertisements a
    JOIN ad_campaigns c ON a.campaign_id = c.id
    WHERE a.id = target_ad_id;

    IF NOT FOUND THEN RETURN; END IF;

    -- 1. Check Limits (Max 2 clicks per user per ad)
    SELECT COUNT(*) INTO click_count
    FROM ad_clicks
    WHERE ad_id = target_ad_id AND user_id = viewer_id;

    IF click_count >= 2 THEN
        RETURN; -- Ignore excess clicks (fraud prevention)
    END IF;

    -- 2. Record Click
    INSERT INTO ad_clicks (ad_id, user_id)
    VALUES (target_ad_id, viewer_id);

    -- 3. Update Aggregate Count
    UPDATE advertisements 
    SET clicks = clicks + 1 
    WHERE id = target_ad_id;

    -- 4. Billing Logic (CPC)
    SELECT cpc_rate INTO cpc_cost FROM ad_settings LIMIT 1;
    
    UPDATE profiles
    SET ad_credits = ad_credits - cpc_cost
    WHERE id = advertiser_id;

    -- Update Campaign Spend
    UPDATE ad_campaigns
    SET spent = spent + cpc_cost
    WHERE id = campaign_id;

END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION track_ad_impression_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_ad_click_secure(UUID) TO authenticated;
