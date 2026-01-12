-- ============================================
-- FIX: ADMIN PERMISSIONS & 400 ERROR FIXES
-- ============================================

-- 1. Create a secure function to check if current user is admin
-- (This prevents infinite recursion in policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 3. Create a clean, non-recursive Admin policy
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING ( public.is_admin() );

-- 4. Ensure Admin status for current user (SAFE TO RUN REPEATEDLY)
-- Replace 'varshithtillu' with your actual username if different
UPDATE public.profiles
SET role = 'admin', is_admin = true
WHERE username = 'varshithtillu';

-- 5. Grant typical RLS Select permissions (just in case)
DROP POLICY IF EXISTS "Anyone can see profiles" ON public.profiles;
CREATE POLICY "Anyone can see profiles" ON public.profiles FOR SELECT USING (true);
