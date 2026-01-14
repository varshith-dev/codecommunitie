-- Fix RLS policies for ad approval system
-- This allows admins to update approval_status on advertisements

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update ad approval status" ON advertisements;
DROP POLICY IF EXISTS "Admins can update advertisements" ON advertisements;

-- Create policy allowing admins to update approval status
CREATE POLICY "Admins can update ad approval status"
ON advertisements
FOR UPDATE
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

-- Verify the approval_status column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'advertisements' 
        AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE advertisements ADD COLUMN approval_status TEXT DEFAULT 'pending';
        ALTER TABLE advertisements ADD COLUMN approved_at TIMESTAMPTZ;
        ALTER TABLE advertisements ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Update any NULL approval_status to 'pending'
UPDATE advertisements 
SET approval_status = 'pending' 
WHERE approval_status IS NULL;

-- Make approval_status NOT NULL with default
ALTER TABLE advertisements ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE advertisements ALTER COLUMN approval_status SET NOT NULL;

COMMENT ON POLICY "Admins can update ad approval status" ON advertisements IS 'Allows admin users to approve or reject advertisements';
