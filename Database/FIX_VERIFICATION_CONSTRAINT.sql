-- Fix unique constraint issue in verification_requests
-- The UNIQUE constraint on (user_id, status) prevents status updates
-- This script removes it and allows proper status changes

-- Drop the problematic constraint
ALTER TABLE public.verification_requests 
DROP CONSTRAINT IF EXISTS unique_pending_request;

-- Add a better constraint: only one pending request per user
-- This uses a partial unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_per_user 
ON public.verification_requests(user_id) 
WHERE status = 'pending';

SELECT 'Constraint fixed! Approve/Reject should now work.' as status;
