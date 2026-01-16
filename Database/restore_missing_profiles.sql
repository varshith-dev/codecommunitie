-- Restore missing profiles from auth.users
-- This script finds any users in auth.users that do NOT have a corresponding entry in public.profiles
-- and creates a default profile for them.

INSERT INTO public.profiles (id, email, username, display_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)), -- Try to get username from metadata, else email prefix
    COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'role', 'user'), -- Default role
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE pp.id IS NULL;

-- Output the count of restored profiles (optional, for verification)
DO $$
DECLARE
    restored_count INTEGER;
BEGIN
    SELECT count(*) INTO restored_count
    FROM auth.users au
    LEFT JOIN public.profiles pp ON au.id = pp.id
    WHERE pp.id IS NULL; -- Should be 0 after the insert
    
    RAISE NOTICE 'Restored profiles check complete.';
END $$;
