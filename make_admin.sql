-- ==========================================
-- GRANT ADMIN PERMISSIONS
-- ==========================================
-- Replace 'varshithtillu' with your actual username if different.

-- 1. Make the user an Admin based on username
UPDATE public.profiles
SET role = 'admin', is_admin = true
WHERE username = 'varshithtillu';

-- 2. ALTERNATIVE: Use Email if username doesn't work (Uncomment and edit)
-- UPDATE public.profiles
-- SET role = 'admin', is_admin = true
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'your_email@example.com');

-- 3. Verify the change
SELECT username, role, is_admin FROM public.profiles WHERE role = 'admin';
