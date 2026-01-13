-- Create table for Admin -> User Prompts
CREATE TABLE IF NOT EXISTS user_prompts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  message text,
  action_label text,
  action_url text,
  type text DEFAULT 'info', -- info, success, warning, error (determines color)
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Users can see their own prompts
CREATE POLICY "Users can view own prompts" 
  ON user_prompts FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins/Moderators can create prompts
CREATE POLICY "Admins can create prompts" 
  ON user_prompts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Users can dismiss (update) their own prompts
CREATE POLICY "Users can dismiss own prompts" 
  ON user_prompts FOR UPDATE 
  USING (auth.uid() = user_id);
