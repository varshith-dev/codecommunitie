-- PROMPT AUTOMATION SCHEMA
-- Stores rules for automatic prompts (e.g., New User Welcome, Time-based)

CREATE TABLE IF NOT EXISTS public.prompt_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_user', 'manual', 'time_based')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'bell', -- 'bell', 'gift', 'alert', 'star', 'megaphone'
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  action_label TEXT,
  action_url TEXT,
  
  -- Email Settings
  email_enabled BOOLEAN DEFAULT false,
  email_subject TEXT,
  email_body TEXT, -- HTML supported
  
  -- Constraints
  duration_seconds INT DEFAULT 0, -- 0 = infinite/dismiss only, >0 = auto dismiss
  delay_seconds INT DEFAULT 0, -- Delay before showing/sending
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prompt_automations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage prompt automations" ON public.prompt_automations;
CREATE POLICY "Admins can manage prompt automations" 
  ON public.prompt_automations 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

DROP POLICY IF EXISTS "Everyone can view active automations" ON public.prompt_automations;
CREATE POLICY "Everyone can view active automations" 
  ON public.prompt_automations 
  FOR SELECT 
  TO authenticated, anon
  USING (is_active = true);

-- Insert Default "New User" Automation
INSERT INTO public.prompt_automations (trigger_type, title, message, icon, type, action_label, action_url, email_enabled, email_subject, email_body)
VALUES (
  'new_user', 
  'Welcome to CodeCommunitie!', 
  'We represent the future of coding. Complete your profile to get started.', 
  'star', 
  'success', 
  'Setup Profile', 
  '/settings',
  true,
  'Welcome to CodeCommunitie! 🚀',
  '<h1>Welcome!</h1><p>We are excited to have you on board. Start exploring the future of coding communities today.</p>'
)
ON CONFLICT DO NOTHING;
