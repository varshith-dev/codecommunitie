-- Add tags column to advertisements for interest targeting
ALTER TABLE advertisements 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Allow advertisers to update their own ads including tags
create policy "Users can update their own ads"
on advertisements for update
to authenticated
using ( 
  exists (
    select 1 from ad_campaigns
    where ad_campaigns.id = advertisements.campaign_id
    and ad_campaigns.advertiser_id = auth.uid()
  )
);
