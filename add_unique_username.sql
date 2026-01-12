-- Add unique constraint to username
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Create an index for faster username lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Function to check if a username exists (useful for RPC calls)
CREATE OR REPLACE FUNCTION check_username_available(username_query TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = username_query
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
