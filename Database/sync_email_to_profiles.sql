-- ========================================
-- SYNC EMAIL TO PROFILES ON SIGNUP
-- ========================================
-- This trigger ensures user email is copied to profiles table

CREATE OR REPLACE FUNCTION sync_email_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile with the user's email
    UPDATE profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_sync_email ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_sync_email
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_email_to_profile();

-- Backfill existing users (sync current emails)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
    AND (p.email IS NULL OR p.email != u.email);
