-- ========================================
-- ADVERTISER SYSTEM DATABASE SCHEMA
-- ========================================

-- Ad Campaigns Table
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advertisements Table
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL,
    cta_text TEXT DEFAULT 'Learn More',
    placement TEXT DEFAULT 'feed', -- feed, sidebar, banner
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, paused, expired
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Performance Metrics
CREATE TABLE IF NOT EXISTS ad_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL, -- impression, click
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaign ON advertisements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_metrics_ad ON ad_metrics(ad_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON ad_metrics(created_at);

-- RLS Policies
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

-- Advertisers can manage their own campaigns
DROP POLICY IF EXISTS "Advertisers manage own campaigns" ON ad_campaigns;
CREATE POLICY "Advertisers manage own campaigns"
    ON ad_campaigns FOR ALL
    TO authenticated
    USING (advertiser_id = auth.uid());

-- Advertisers can manage their own ads
DROP POLICY IF EXISTS "Advertisers manage own ads" ON advertisements;
CREATE POLICY "Advertisers manage own ads"
    ON advertisements FOR ALL
    TO authenticated
    USING (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id = auth.uid()
        )
    );

-- Everyone can view active ads
DROP POLICY IF EXISTS "Everyone views active ads" ON advertisements;
CREATE POLICY "Everyone views active ads"
    ON advertisements FOR SELECT
    TO authenticated, anon
    USING (status = 'active');

-- Metrics readable by ad owners
DROP POLICY IF EXISTS "Ad owners view metrics" ON ad_metrics;
CREATE POLICY "Ad owners view metrics"
    ON ad_metrics FOR SELECT
    TO authenticated
    USING (
        ad_id IN (
            SELECT a.id FROM advertisements a
            JOIN ad_campaigns c ON a.campaign_id = c.id
            WHERE c.advertiser_id = auth.uid()
        )
    );

-- Function to track ad impression/click
CREATE OR REPLACE FUNCTION track_ad_action(
    p_ad_id UUID,
    p_action_type TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Insert metric
    INSERT INTO ad_metrics (ad_id, user_id, action_type)
    VALUES (p_ad_id, p_user_id, p_action_type);
    
    -- Update ad counters
    IF p_action_type = 'impression' THEN
        UPDATE advertisements
        SET impressions = impressions + 1
        WHERE id = p_ad_id;
    ELSIF p_action_type = 'click' THEN
        UPDATE advertisements
        SET clicks = clicks + 1
        WHERE id = p_ad_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_ad_action(UUID, TEXT, UUID) TO authenticated, anon;
