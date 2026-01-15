-- Add deleted_at column for soft deletes
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update RLS policies to exclude deleted ads from public view
CREATE POLICY "Public can view active non-deleted ads"
ON advertisements FOR SELECT
USING (
  status = 'active' 
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM ad_campaigns
    WHERE ad_campaigns.id = advertisements.campaign_id
    AND ad_campaigns.status = 'active'
  )
);
