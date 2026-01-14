-- ========================================
-- ADMIN PROMPT SETTINGS SCHEMA
-- ========================================

CREATE TABLE IF NOT EXISTS prompt_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    message_template TEXT NOT NULL,
    duration_type TEXT DEFAULT 'until_action', -- time_based, until_action
    duration_minutes INT, -- only used if time_based
    auto_send_email BOOLEAN DEFAULT false,
    email_template TEXT, -- For automated emails
    icon_type TEXT DEFAULT 'bell', -- bell, mail, warning, verified, info
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO prompt_settings (template_name, display_name, message_template, icon_type, auto_send_email)
VALUES
    ('email_verification', 'Email Verification', 'Please verify your email address to unlock all features', 'mail', true),
    ('complete_profile', 'Complete Profile', 'Complete your profile to get the most out of CodeCommunities', 'info', false),
    ('welcome_message', 'Welcome', 'Welcome to CodeCommunities! Get started by creating your first post', 'bell', false)
ON CONFLICT (template_name) DO NOTHING;

-- RLS
ALTER TABLE prompt_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can modify
DROP POLICY IF EXISTS "Admins manage prompts" ON prompt_settings;
CREATE POLICY "Admins manage prompts"
    ON prompt_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Everyone can read active prompts
DROP POLICY IF EXISTS "Everyone reads active prompts" ON prompt_settings;
CREATE POLICY "Everyone reads active prompts"
    ON prompt_settings FOR SELECT
    TO authenticated, anon
    USING (enabled = true);

-- Function to get applicable prompts for a user
CREATE OR REPLACE FUNCTION get_user_prompts(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    template_name TEXT,
    message_template TEXT,
    icon_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_info AS (
        SELECT 
            u.email_confirmed_at,
            p.bio,
            p.profile_picture_url
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE u.id = p_user_id
    )
    SELECT 
        ps.id,
        ps.template_name,
        ps.message_template,
        ps.icon_type
    FROM prompt_settings ps
    CROSS JOIN user_info ui
    WHERE ps.enabled = true
        AND (
            -- Email verification prompt
            (ps.template_name = 'email_verification' AND ui.email_confirmed_at IS NULL)
            OR
            -- Complete profile prompt  
            (ps.template_name = 'complete_profile' AND (ui.bio IS NULL OR ui.profile_picture_url IS NULL))
            OR
            -- Welcome message (always show for first 7 days)
            (ps.template_name = 'welcome_message')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_prompts(UUID) TO authenticated;
