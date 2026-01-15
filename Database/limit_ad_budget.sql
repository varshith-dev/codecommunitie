-- Ensure budget and spent columns exist in ad_campaigns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'budget') THEN
        ALTER TABLE ad_campaigns ADD COLUMN budget NUMERIC DEFAULT 1000;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'spent') THEN
        ALTER TABLE ad_campaigns ADD COLUMN spent NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Update track_ad_click to handle budget consumption
CREATE OR REPLACE FUNCTION track_ad_click(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign_id UUID;
    v_cost NUMERIC := 5; -- Cost per click (e.g., 5 rupees/credits)
    v_new_spent NUMERIC;
    v_budget NUMERIC;
BEGIN
    -- Increment clicks on ad
    UPDATE advertisements
    SET clicks = clicks + 1
    WHERE id = ad_id
    RETURNING campaign_id INTO v_campaign_id;

    IF v_campaign_id IS NOT NULL THEN
        -- Update campaign spent
        UPDATE ad_campaigns
        SET spent = COALESCE(spent, 0) + v_cost
        WHERE id = v_campaign_id
        RETURNING spent, budget INTO v_new_spent, v_budget;

        -- Check if budget exceeded
        IF v_new_spent >= v_budget THEN
            UPDATE ad_campaigns
            SET status = 'completed'
            WHERE id = v_campaign_id;
        END IF;
    END IF;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION track_ad_click(UUID) TO anon, authenticated;
