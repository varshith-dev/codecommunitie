-- Templates for Admin User Prompts
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  action_label text,
  action_url text, -- default action
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage templates" ON prompt_templates;

CREATE POLICY "Admins can manage templates" 
  ON prompt_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Insert some defaults
INSERT INTO prompt_templates (title, message, type, action_url) VALUES 
('Complete Profile', 'Please complete your profile details.', 'info', '/settings'),
('Warning: Conduct', 'Your recent activity has been flagged.', 'warning', '/guidelines')
ON CONFLICT DO NOTHING;
