-- Fix verification_requests table foreign key
-- Run this to fix the foreign key reference

-- Drop the existing table if it has wrong foreign key
DROP TABLE IF EXISTS public.verification_requests CASCADE;

-- Recreate with correct foreign key to profiles
CREATE TABLE public.verification_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    CONSTRAINT unique_pending_request UNIQUE (user_id, status)
);

-- Create indexes
CREATE INDEX idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX idx_verification_requests_requested_at ON public.verification_requests(requested_at DESC);

-- Disable RLS
ALTER TABLE public.verification_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.verification_requests TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE verification_requests_id_seq TO authenticated;

SELECT 'Verification requests table fixed!' as status;
