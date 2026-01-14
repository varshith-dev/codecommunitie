-- ============================================
-- GRANT ADMIN PRIVILEGES
-- ============================================
-- Run this to make yourself an admin

-- Option 1: Grant admin by email
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email = 'varshithtillu08@gmail.com';

-- Option 2: Or grant admin to current logged-in user
-- UPDATE public.profiles   
-- SET role = 'admin', is_admin = true, is_verified = true
-- WHERE id = auth.uid();

-- Verify it worked
SELECT id, username, email, role, is_admin, is_verified 
FROM public.profiles 
WHERE email = 'varshithtillu08@gmail.com';
