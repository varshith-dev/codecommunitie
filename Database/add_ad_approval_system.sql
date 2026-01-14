-- Add approval_status column to advertisements table
-- This enables admin approval workflow for ads before they appear in feed

ALTER TABLE advertisements
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Set existing ads to approved (grandfather existing ads)
UPDATE advertisements
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- Add index for efficient filtering
CREATE INDEX idx_advertisements_approval_status ON advertisements(approval_status);

-- Add approved_at timestamp
ALTER TABLE advertisements
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES profiles(id),
ADD COLUMN rejection_reason TEXT;

COMMENT ON COLUMN advertisements.approval_status IS 'Admin approval status: pending, approved, rejected';
COMMENT ON COLUMN advertisements.approved_at IS 'Timestamp when ad was approved by admin';
COMMENT ON COLUMN advertisements.approved_by IS 'Admin user ID who approved the ad';
COMMENT ON COLUMN advertisements.rejection_reason IS 'Reason provided by admin if rejected';
