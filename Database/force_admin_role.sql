-- Force update the user 'varshith.code' to be an admin
-- Run this in the Supabase SQL Editor

UPDATE profiles
SET role = 'admin'
WHERE username = 'varshith.code';

-- Also output the result to verify
SELECT id, username, role FROM profiles WHERE username = 'varshith.code';
