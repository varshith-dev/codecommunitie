-- =========================================================
-- FIX ADMIN PERMISSIONS (RLS "Permission Denied" Fix)
-- =========================================================

-- 1. Create a Secure Admin Check Function (Bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs with owner permissions, bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$;

-- 2. Update Policies on 'profiles'
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow Admins to UPDATE any profile (Fixes "Update failed: Permission denied")
DROP POLICY IF EXISTS "Admins Update All" ON public.profiles;
CREATE POLICY "Admins Update All" ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Allow Admins to DELETE any profile (For Admin Delete features)
DROP POLICY IF EXISTS "Admins Delete All" ON public.profiles;
CREATE POLICY "Admins Delete All" ON public.profiles
FOR DELETE
USING (public.is_admin());

-- Ensure existing policies are still there (for normal users)
DROP POLICY IF EXISTS "Public Read Access" ON public.profiles;
CREATE POLICY "Public Read Access" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "User Create Own Profile" ON public.profiles;
CREATE POLICY "User Create Own Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "User Update Own Profile" ON public.profiles;
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 3. Double Check Admin Status
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email IN ('varshith.code@gmail.com', 'varshithtillu08@gmail.com');

SELECT '✅ Admin Permissions Fixed. You can now Ban/Update users.' as status;
