-- ULTIMATE ADMIN FIX
-- 1. Grant Admin Role to the specific email (handling the potential double 'l' typo)
UPDATE profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email ILIKE 'varshithtillu08@%'
);

-- 2. Grant admin role to the username 'varshith.code'
UPDATE profiles
SET role = 'admin'
WHERE username = 'varshithtillu';

-- 3. Verify the update and show us who is admin
SELECT p.id, p.username, p.role, u.email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email ILIKE 'varshithtillu08@%' OR p.username = 'varshithtillu';

-- 4. Re-create the function with BETTER ERROR MESSAGES to help us debug
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_new_prompt_id UUID;
    v_current_role TEXT;
BEGIN
    -- Get current role for debugging
    SELECT role INTO v_current_role FROM profiles WHERE id = auth.uid();

    -- Check if the caller is an admin/moderator
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Access denied. User ID: %, Role found: %. REQUIRED: admin or moderator.', auth.uid(), v_current_role;
    END IF;

    -- Insert the prompt
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

-- Grant execute permission again just in case
GRANT EXECUTE ON FUNCTION admin_send_user_prompt TO authenticated;
