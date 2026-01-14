-- Fix RLS policy for inserting into user_prompts
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or incorrect policies first
DROP POLICY IF EXISTS "Admins can create prompts" ON user_prompts;
DROP POLICY IF EXISTS "Enable insert for admins" ON user_prompts;

-- Create the INSERT policy clearly
CREATE POLICY "Admins can create prompts"
  ON user_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Ensure authenticated users have table-level permission (RLS still filters actual rows)
GRANT ALL ON user_prompts TO authenticated;
GRANT ALL ON user_prompts TO service_role;
