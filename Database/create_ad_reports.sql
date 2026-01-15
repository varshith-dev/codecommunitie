-- Safely create types if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason_type') THEN 
        CREATE TYPE report_reason_type AS ENUM ('fraud', 'inappropriate', 'spam', 'misleading', 'other'); 
    END IF; 
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status_type') THEN 
        CREATE TYPE report_status_type AS ENUM ('pending', 'reviewed', 'dismissed'); 
    END IF; 
END $$;

-- Create Ad Reports table (IF NOT EXISTS handles it)
CREATE TABLE IF NOT EXISTS ad_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    reason report_reason_type NOT NULL,
    description TEXT,
    status report_status_type DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ad_reports ENABLE ROW LEVEL SECURITY;

-- Policies (Drop first to avoid "already exists" error if running multiple times)
DROP POLICY IF EXISTS "Users can create reports" ON ad_reports;
CREATE POLICY "Users can create reports" ON ad_reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON ad_reports;
CREATE POLICY "Admins can view all reports" ON ad_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update reports" ON ad_reports;
CREATE POLICY "Admins can update reports" ON ad_reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Advertisers can view reports for their ads" ON ad_reports;
CREATE POLICY "Advertisers can view reports for their ads" ON ad_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM advertisements
            JOIN ad_campaigns ON advertisements.campaign_id = ad_campaigns.id
            WHERE advertisements.id = ad_reports.ad_id
            AND ad_campaigns.advertiser_id = auth.uid()
        )
    );
