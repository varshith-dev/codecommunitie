-- FINAL ADMIN FIX
-- 1. Ensure extensions and auth schema are accessible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Grant Admin Role by Username (Primary Target)
UPDATE profiles
SET role = 'admin'
WHERE username = 'varshithtillu';

-- 3. Grant Admin Role by Email (Secondary Target, handling typos)
UPDATE profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email ILIKE 'varshithtillu08@%'
);

-- 4. Re-create the function with CORRECT SEARCH PATH
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
-- IMPORTANT: Include 'auth' and 'extensions' in search_path so auth.uid() works!
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_curr_user_id UUID;
    v_is_admin BOOLEAN;
    v_new_prompt_id UUID;
    v_debug_role TEXT;
BEGIN
    -- Try to get user ID from auth.uid() or directly from settings
    v_curr_user_id := auth.uid();
    
    -- Fallback: try raw setting if auth.uid() failed
    IF v_curr_user_id IS NULL THEN
        BEGIN
            v_curr_user_id := current_setting('request.jwt.claim.sub', true)::uuid;
        EXCEPTION WHEN OTHERS THEN
            v_curr_user_id := NULL;
        END;
    END IF;

    -- Get current role for debugging
    SELECT role INTO v_debug_role FROM profiles WHERE id = v_curr_user_id;

    -- Check if the caller is an admin/moderator
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = v_curr_user_id
        AND role IN ('admin', 'moderator')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Access denied. ID: %, Role: %. Make sure you are logged in.', v_curr_user_id, v_debug_role;
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

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_send_user_prompt TO authenticated;
GRANT EXECUTE ON FUNCTION admin_send_user_prompt TO service_role;
GRANT EXECUTE ON FUNCTION admin_send_user_prompt TO public; -- Fallback
