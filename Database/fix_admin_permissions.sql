-- ==========================================
-- FIX: ADMIN PERMISSIONS & USER COLUMNS
-- ==========================================
-- Run this in the Supabase SQL Editor to fix the content not saving issues.

-- 1. Ensure columns exist (Idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Drop potentially conflicting policies (to start fresh for updates)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 3. Create Update Policy
-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow Admins to update ALL profiles
-- (Assumes the current user has role='admin' OR is_admin=true)
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_admin = true)
  )
);

-- 4. Create Policy for Banning (Admins only)
-- Usually covered by "Admins can update any profile", but good to be explicit if needed.
-- The above policy covers all updates.

-- 5. Enable RLS (Should be already on, but good to ensure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verify Admin existence
-- If you are the developer, run this line (replace 'your-uuid' if you know it, otherwise use email):
-- UPDATE public.profiles SET role = 'admin', is_admin = true WHERE id = auth.uid(); 
-- (You cannot run the above line easily in SQL editor without the specific UUID, 
--  so you might need to update your own row manually in the Table Editor first, 
--  or rely on the fact that you might already have is_admin=true).
