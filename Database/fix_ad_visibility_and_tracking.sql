-- Comprehensive fix for ad display and metrics tracking
-- This enables normal users to see approved ads and tracks impressions/clicks

-- ============================================
-- PART 1: Enable users to view approved ads
-- ============================================

-- Drop existing read policies
DROP POLICY IF EXISTS "Anyone can view approved ads" ON advertisements;
DROP POLICY IF EXISTS "Public can view approved ads" ON advertisements;

-- Allow authenticated and anonymous users to view approved ads
CREATE POLICY "Anyone can view approved ads"
ON advertisements
FOR SELECT
TO public
USING (
    approval_status = 'approved' 
    AND status = 'active'
);

-- ============================================
-- PART 2: Fix impressions and clicks tracking
-- ============================================

-- Ensure impressions and clicks columns exist with defaults
DO $$ 
BEGIN
    -- Add impressions column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'advertisements' AND column_name = 'impressions'
    ) THEN
        ALTER TABLE advertisements ADD COLUMN impressions INTEGER DEFAULT 0;
    END IF;

    -- Add clicks column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'advertisements' AND column_name = 'clicks'
    ) THEN
        ALTER TABLE advertisements ADD COLUMN clicks INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing NULL values to 0
UPDATE advertisements SET impressions = 0 WHERE impressions IS NULL;
UPDATE advertisements SET clicks = 0 WHERE clicks IS NULL;

-- Make columns NOT NULL
ALTER TABLE advertisements ALTER COLUMN impressions SET DEFAULT 0;
ALTER TABLE advertisements ALTER COLUMN clicks SET DEFAULT 0;
ALTER TABLE advertisements ALTER COLUMN impressions SET NOT NULL;
ALTER TABLE advertisements ALTER COLUMN clicks SET NOT NULL;

-- ============================================
-- PART 3: Enable tracking updates
-- ============================================

-- Allow anyone to increment impressions and clicks (for API tracking)
DROP POLICY IF EXISTS "Allow impression tracking" ON advertisements;
DROP POLICY IF EXISTS "Allow click tracking" ON advertisements;

CREATE POLICY "Allow impression tracking"
ON advertisements
FOR UPDATE
TO public
USING (approval_status = 'approved' AND status = 'active')
WITH CHECK (approval_status = 'approved' AND status = 'active');

-- ============================================
-- PART 4: Create tracking functions
-- ============================================

-- Function to track ad impression
CREATE OR REPLACE FUNCTION track_ad_impression(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE advertisements
    SET impressions = impressions + 1
    WHERE id = ad_id
    AND approval_status = 'approved'
    AND status = 'active';
END;
$$;

-- Function to track ad click
CREATE OR REPLACE FUNCTION track_ad_click(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE advertisements
    SET clicks = clicks + 1
    WHERE id = ad_id
    AND approval_status = 'approved'
    AND status = 'active';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION track_ad_impression(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_ad_click(UUID) TO anon, authenticated;

COMMENT ON POLICY "Anyone can view approved ads" ON advertisements IS 'Allows all users to view approved, active advertisements';
COMMENT ON FUNCTION track_ad_impression IS 'Safely increments impression count for an ad';
COMMENT ON FUNCTION track_ad_click IS 'Safely increments click count for an ad';
