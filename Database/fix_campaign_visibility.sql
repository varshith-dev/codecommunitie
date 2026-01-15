-- Fix RLS policies for ad campaigns to allow public visibility of ads
-- This is necessary because fetching ads requires joining with the ad_campaigns table

-- Drop existing policies if they exist (to be safe)
DROP POLICY IF EXISTS "Public can view active campaigns" ON ad_campaigns;

-- Allow public to view active campaigns
-- This is required for the feed query: campaign:ad_campaigns!inner(status)
CREATE POLICY "Public can view active campaigns"
ON ad_campaigns
FOR SELECT
TO public
USING (status = 'active');

-- Ensure status column exists and has defaults
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ad_campaigns' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE ad_campaigns ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

COMMENT ON POLICY "Public can view active campaigns" ON ad_campaigns IS 'Allows public to view active campaigns (needed for ad display)';
