-- Fix existing usernames with spaces by replacing them with underscores
-- This ensures all usernames are URL-friendly

UPDATE profiles
SET username = REPLACE(username, ' ', '_')
WHERE username LIKE '% %';

-- Also update display_name to maintain consistency if it was set to username
UPDATE profiles
SET display_name = REPLACE(display_name, ' ', '_')
WHERE display_name LIKE '% %' AND display_name = (SELECT username FROM profiles p2 WHERE p2.id = profiles.id);

COMMENT ON COLUMN profiles.username IS 'Unique username (spaces automatically replaced with underscores)';
