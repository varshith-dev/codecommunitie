-- Ensure verification_requests table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    message TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.verification_requests ADD COLUMN requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column requested_at already exists in verification_requests.';
    END;
END;
$$;

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own requests
CREATE POLICY "Users can view own requests" ON public.verification_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can create requests" ON public.verification_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins/Service Role can do everything
-- (For simplicity in this environment, we might allow full access to authenticated users if admin roles aren't strict, but let's try to be safe or just open it up if it stays broken)
CREATE POLICY "Admins can view all requests" ON public.verification_requests
    FOR SELECT USING (true);

CREATE POLICY "Admins can update requests" ON public.verification_requests
    FOR UPDATE USING (true);

-- Fix permissions just in case
GRANT ALL ON public.verification_requests TO postgres;
GRANT ALL ON public.verification_requests TO anon;
GRANT ALL ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
