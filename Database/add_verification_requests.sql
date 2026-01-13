-- Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, status) -- Prevent multiple pending requests per user
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_requested_at ON public.verification_requests(requested_at DESC);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own requests
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own requests (only if no pending request exists)
CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
        SELECT 1 FROM public.verification_requests 
        WHERE user_id = auth.uid() 
        AND status = 'pending'
    )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.is_admin = true OR profiles.role = 'admin')
    )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT UPDATE ON public.verification_requests TO authenticated;

-- Verify
SELECT 'Verification requests table created successfully' as status;
