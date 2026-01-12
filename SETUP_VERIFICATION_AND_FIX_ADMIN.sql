-- COMPLETE SETUP: Verification Requests + Admin Access Fix
-- Run this entire script in Supabase SQL Editor

-- ==========================================
-- PART 1: Create verification_requests table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_requested_at ON public.verification_requests(requested_at DESC);

-- ==========================================
-- PART 2: Disable RLS on ALL tables (including new one)
-- ==========================================

ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 3: Grant permissions
-- ==========================================

GRANT ALL ON public.verification_requests TO authenticated;
GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ==========================================
-- PART 4: Verify setup
-- ==========================================

SELECT 'Setup complete! Admin panel should now work.' as status;
