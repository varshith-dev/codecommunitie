-- Add is_banned column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create index for banning lookups
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(is_banned);
