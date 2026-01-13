-- ============================================
-- QUICK FIX: Manual Profile Creation
-- ============================================
-- Run this if your posts don't show in the feed

-- Step 1: Check if your profile exists
SELECT id, username, display_name FROM public.profiles;

-- Step 2: If your profile is missing, get your user ID from auth
SELECT id, email FROM auth.users;

-- Step 3: Create your profile manually (REPLACE the values below)
-- Replace 'YOUR-USER-ID-HERE' with your actual ID from Step 2
-- Replace 'YOUR-USERNAME' with your desired username
INSERT INTO public.profiles (id, username, created_at)
VALUES (
  'YOUR-USER-ID-HERE'::uuid, 
  'YOUR-USERNAME',
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET username = EXCLUDED.username;

-- Step 4: Verify your profile was created
SELECT * FROM public.profiles WHERE id = 'YOUR-USER-ID-HERE'::uuid;

-- ============================================
-- Optional: Update your profile with more info
-- ============================================
UPDATE public.profiles 
SET 
  display_name = 'Your Display Name',
  bio = 'Your bio here',
  website = 'https://yourwebsite.com'
WHERE id = 'YOUR-USER-ID-HERE'::uuid;
