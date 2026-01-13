-- Custom OTP Verification System
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);

-- RLS (Only server can read/write usually, but we can enable insert for authenticated if needed, 
-- but this table is mainly for the Service Role API to manage)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Service Role has full access (default)
-- No public access policies needed as interaction is via Admin API
