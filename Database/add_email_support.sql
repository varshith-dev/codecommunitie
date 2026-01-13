-- Add email column to verification_requests
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Function to sync email from auth.users (New Logic)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username', -- Assuming metadata has it, or generate one
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to copy email on new signups (if not already there)
-- Note: This replaces/updates existing trigger if named same
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ONE-TIME BACKFILL (Only works if ran by Superuser/Dashboard SQL Editor)
-- We can't guarantee this works from client, but user will run it in dashboard.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;
