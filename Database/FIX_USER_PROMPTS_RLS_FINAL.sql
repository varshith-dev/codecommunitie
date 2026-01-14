-- Fix RLS for user_prompts table to allow admins to send prompts
-- This allows admins to INSERT into user_prompts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can send user prompts" ON user_prompts;
DROP POLICY IF EXISTS "Users can view their own prompts" ON user_prompts;
DROP POLICY IF EXISTS "Users can dismiss their own prompts" ON user_prompts;

-- Allow admins to send prompts (INSERT)
CREATE POLICY "Admins can send user prompts"
ON user_prompts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow users to view their own prompts
CREATE POLICY "Users can view their own prompts"
ON user_prompts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to dismiss their own prompts
CREATE POLICY "Users can dismiss their own prompts"
ON user_prompts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
