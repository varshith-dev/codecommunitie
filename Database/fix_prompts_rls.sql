-- Fix RLS for viewing prompts
DROP POLICY IF EXISTS "Admins can view all prompts" ON user_prompts;

CREATE POLICY "Admins can view all prompts"
  ON user_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Also ensure admins can DELETE prompts (I implemented the button but didn't check policy)
DROP POLICY IF EXISTS "Admins can delete prompts" ON user_prompts;

CREATE POLICY "Admins can delete prompts"
  ON user_prompts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
