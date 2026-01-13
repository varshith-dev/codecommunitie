-- Add full_name and dob columns to verification_requests table
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'verification_requests';
