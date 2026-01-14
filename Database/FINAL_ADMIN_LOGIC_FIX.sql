-- =========================================================
-- FINAL ADMIN LOGIC FIX (Covers ALL Admin Tables)
-- =========================================================

-- 1. Ensure Secure Admin Check Exists
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

-- =========================================================
-- TABLE: PROFILES (Already Fixed, but ensuring)
--Action: Banning, Revoking Verification, Changing Roles
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins Update All" ON public.profiles;
CREATE POLICY "Admins Update All" ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins Delete All" ON public.profiles;
CREATE POLICY "Admins Delete All" ON public.profiles FOR DELETE USING (public.is_admin());


-- =========================================================
-- TABLE: USER_PROMPTS (Fixes "Send User Prompt" & History Delete)
-- Action: Send Prompt (INSERT), Delete History (DELETE)
-- =========================================================
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

-- Admins can do EVERYTHING on user_prompts
DROP POLICY IF EXISTS "Admins Manage Prompts" ON public.user_prompts;
CREATE POLICY "Admins Manage Prompts" ON public.user_prompts FOR ALL USING (public.is_admin());

-- Users can READ and UPDATE (dismiss) their own prompts
DROP POLICY IF EXISTS "Users Read Own Prompts" ON public.user_prompts;
CREATE POLICY "Users Read Own Prompts" ON public.user_prompts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Dismiss Own Prompts" ON public.user_prompts;
CREATE POLICY "Users Dismiss Own Prompts" ON public.user_prompts FOR UPDATE USING (auth.uid() = user_id);


-- =========================================================
-- TABLE: VERIFICATION_REQUESTS
-- Action: Viewing Verification Info in User Manager
-- =========================================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT,
    date_of_birth DATE,
    id_document_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins View Verification" ON public.verification_requests;
CREATE POLICY "Admins View Verification" ON public.verification_requests FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users Create Requests" ON public.verification_requests;
CREATE POLICY "Users Create Requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users View Own Requests" ON public.verification_requests;
CREATE POLICY "Users View Own Requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);


-- =========================================================
-- TABLE: PROMPT_TEMPLATES
-- Action: Loading Templates in Dropdown
-- =========================================================
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    message TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Templates" ON public.prompt_templates;
CREATE POLICY "Read Templates" ON public.prompt_templates FOR SELECT USING (true); -- Everyone can read templates? Or just Admins? Assuming Admins use it.

DROP POLICY IF EXISTS "Admins Manage Templates" ON public.prompt_templates;
CREATE POLICY "Admins Manage Templates" ON public.prompt_templates FOR ALL USING (public.is_admin());


-- =========================================================
-- FINAL GRANT
-- =========================================================
UPDATE public.profiles 
SET role = 'admin', is_admin = true, is_verified = true
WHERE email IN ('varshith.code@gmail.com', 'varshithtillu08@gmail.com');

SELECT '✅ All Admin Logics (Profiles, Prompts, Verification) Fixed.' as status;
