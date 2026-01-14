-- Grant Admin Role to a user by email
-- REPLACE 'your_email@example.com' WITH THE ACTUAL EMAIL

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'varshithtillu08@gmail.com'
);

-- Verify the update
SELECT id, email, role FROM profiles 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'varshithtillu08@gmail.com'
);
