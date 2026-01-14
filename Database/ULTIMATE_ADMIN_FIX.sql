-- =========================================================
-- ULTIMATE ADMIN FIX (Run This Once To Fix Everything)
-- =========================================================

-- 1. FIX THE ADMIN CHECK FUNCTION (Security Definer)
-- This bypasses RLS so the database knows you are an admin instantly.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 2. FIX PROFILES (Revoking Verification, Banning)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins Update All" ON public.profiles;
CREATE POLICY "Admins Update All" ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins Delete All" ON public.profiles;
CREATE POLICY "Admins Delete All" ON public.profiles FOR DELETE USING (public.is_admin());

-- 3. FIX USER PROMPTS (Sending Notifications)
CREATE TABLE IF NOT EXISTS public.user_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    action_label TEXT,
    action_url TEXT,
    icon TEXT,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins Manage Prompts" ON public.user_prompts;
CREATE POLICY "Admins Manage Prompts" ON public.user_prompts FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users Read Own Prompts" ON public.user_prompts;
CREATE POLICY "Users Read Own Prompts" ON public.user_prompts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Dismiss Own Prompts" ON public.user_prompts;
CREATE POLICY "Users Dismiss Own Prompts" ON public.user_prompts FOR UPDATE USING (auth.uid() = user_id);

-- 4. FIX VERIFICATION REQUESTS (Viewing Requests)
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT,
    date_of_birth DATE,
    id_document_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure columns exist (if table already existed)
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins View Verification" ON public.verification_requests;
CREATE POLICY "Admins View Verification" ON public.verification_requests FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users Create Requests" ON public.verification_requests;
CREATE POLICY "Users Create Requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users View Own Requests" ON public.verification_requests;
CREATE POLICY "Users View Own Requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);

-- 5. FIX PROMPT TEMPLATES (Loading Dropdown)
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT,
    action_url TEXT,       -- matching front-end usage
    action_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Templates" ON public.prompt_templates;
CREATE POLICY "Read Templates" ON public.prompt_templates FOR SELECT USING (true); -- Everyone can read

DROP POLICY IF EXISTS "Admins Manage Templates" ON public.prompt_templates;
CREATE POLICY "Admins Manage Templates" ON public.prompt_templates FOR ALL USING (public.is_admin());

-- 6. FORCE ADMIN STATUS (Just in case)
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email IN ('varshith.code@gmail.com', 'varshithtillu08@gmail.com');

SELECT '✅ ULTIMATE FIX APPLIED. Refresh your page.' as status;
