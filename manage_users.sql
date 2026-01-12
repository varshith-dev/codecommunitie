-- Add verification and role columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create Verified Badge view for frontend (optional helper, but direct select is fine)
-- ensuring we can filter by these new columns
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
