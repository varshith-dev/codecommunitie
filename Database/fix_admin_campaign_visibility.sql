-- Fix RLS policies to ensure Admins can view ALL campaigns and advertisements

-- ============================================
-- PART 1: Admin Policies for ad_campaigns
-- ============================================

-- Drop existing admin policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all campaigns" ON ad_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON ad_campaigns;

-- Create comprehensive Admin policy for ad_campaigns
CREATE POLICY "Admins can manage campaigns"
ON ad_campaigns
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ============================================
-- PART 2: Admin Policies for advertisements
-- ============================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can view all ads" ON advertisements;

-- Create comprehensive Admin policy for advertisements
-- Note: We might already have approval policies, but this ensures FULL access (view, delete, etc.)
CREATE POLICY "Admins can manage advertisements"
ON advertisements
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

COMMENT ON POLICY "Admins can manage campaigns" ON ad_campaigns IS 'Allows admins full control over ad campaigns';
COMMENT ON POLICY "Admins can manage advertisements" ON advertisements IS 'Allows admins full control over advertisements';
