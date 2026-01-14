-- Create a stored procedure to bypass RLS for admin inserts
-- This is much more reliable than relying on recursive RLS policies
CREATE OR REPLACE FUNCTION admin_send_user_prompt(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_icon TEXT,
    p_type TEXT,
    p_action_label TEXT,
    p_action_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (admin)
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_new_prompt_id UUID;
BEGIN
    -- 1. Check if the caller is an admin/moderator
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Access denied: Only admins can send prompts';
    END IF;

    -- 2. Insert the prompt (bypassing RLS because of SECURITY DEFINER)
    INSERT INTO user_prompts (
        user_id, title, message, icon, type, action_label, action_url
    )
    VALUES (
        p_user_id, p_title, p_message, p_icon, p_type, p_action_label, p_action_url
    )
    RETURNING id INTO v_new_prompt_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_prompt_id);
END;
$$;

-- Grant execute permission to authenticated users (internal check handles security)
GRANT EXECUTE ON FUNCTION admin_send_user_prompt TO authenticated;

-- ALSO Fix the RLS just in case direct insert is preferred (requires profiles to be readable)
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Ensure profiles is readable by authenticated users (essential for many RLS checks)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Re-apply 'Admins can create prompts' with a simplified check
DROP POLICY IF EXISTS "Admins can create prompts" ON user_prompts;
CREATE POLICY "Admins can create prompts"
  ON user_prompts FOR INSERT
  WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role IN ('admin', 'moderator')
    )
  );
