-- Add columns if missing
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS feature_label TEXT;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Read access for everyone
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
CREATE POLICY "Tags are viewable by everyone" 
ON public.tags FOR SELECT 
USING (true);

-- 2. Insert/Update/Delete for Admins
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;
CREATE POLICY "Admins can manage tags"
ON public.tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.is_admin = true)
  )
);

-- 3. Also allow if using Service Role (implicit, but good to know)

-- Grant usage to authenticated
GRANT ALL ON public.tags TO service_role;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;

-- Force schema cache reload (sometimes needed)
NOTIFY pgrst, 'reload schema';
