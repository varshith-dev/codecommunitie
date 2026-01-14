-- ====================================
-- ADMIN USER MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ====================================
-- This migration adds comprehensive admin features for user management

-- 1. ADD EMAIL TO PROFILES (if missing)
-- ====================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        CREATE INDEX idx_profiles_email ON profiles(email);
    END IF;
END $$;

-- 2. CREATE USER DEVICES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT, -- 'Chrome', 'Firefox', 'Safari', etc.
    os TEXT, -- 'Windows', 'Mac', 'Android', 'iOS'
    ip_address TEXT,
    user_agent TEXT,
    location_country TEXT,
    location_city TEXT,
    last_login TIMESTAMPTZ DEFAULT NOW(),
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    login_count INT DEFAULT 1,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to track device+location combos
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_device 
ON user_devices(user_id, device_type, browser, os, ip_address);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_suspicious ON user_devices(is_suspicious) WHERE is_suspicious = TRUE;

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
CREATE POLICY "Users can view own devices" ON user_devices 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;
CREATE POLICY "Admins can view all devices" ON user_devices 
    FOR ALL TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. CREATE AUTOMATED PROMPTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS automated_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_type TEXT NOT NULL, -- 'verify_email', 'welcome', 'inactive', 'security_alert'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT DEFAULT 'bell', -- 'bell', 'warning', 'info', 'star', 'alert'
    btn_label TEXT,
    btn_color TEXT DEFAULT 'blue', -- 'blue', 'red', 'green', 'yellow'
    action_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'dismissed', 'clicked'
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON automated_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON automated_prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_type ON automated_prompts(prompt_type);

-- Enable RLS
ALTER TABLE automated_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users see own prompts" ON automated_prompts;
CREATE POLICY "Users see own prompts" ON automated_prompts 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id AND status != 'pending');

DROP POLICY IF EXISTS "Admins manage all prompts" ON automated_prompts;
CREATE POLICY "Admins manage all prompts" ON automated_prompts 
    FOR ALL TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. CREATE EMAIL VERIFICATION REMINDERS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS email_verification_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reminder_count INT DEFAULT 0,
    last_reminder_sent TIMESTAMPTZ,
    next_reminder_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_reminders_user ON email_verification_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_reminders_due 
    ON email_verification_reminders(next_reminder_due) 
    WHERE next_reminder_due IS NOT NULL;

-- Enable RLS
ALTER TABLE email_verification_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins manage reminders" ON email_verification_reminders;
CREATE POLICY "Admins manage reminders" ON email_verification_reminders 
    FOR ALL TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. CREATE ADMIN ACTIONS LOG TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS admin_actions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'send_prompt', 'block_user', 'send_verification', 'view_devices'
    target_user_id UUID REFERENCES auth.users(id),
    action_details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_date ON admin_actions_log(created_at DESC);

-- Enable RLS
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Only admins can view action logs" ON admin_actions_log;
CREATE POLICY "Only admins can view action logs" ON admin_actions_log 
    FOR ALL TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. CREATE HELPER FUNCTIONS
-- ====================================

-- Function to get unverified users
CREATE OR REPLACE FUNCTION get_unverified_users()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    username TEXT,
    created_at TIMESTAMPTZ,
    days_unverified INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id as user_id,
        au.email,
        p.username,
        au.created_at,
        EXTRACT(DAY FROM NOW() - au.created_at)::INT as days_unverified
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE au.email_confirmed_at IS NULL
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action_type TEXT,
    p_target_user_id UUID DEFAULT NULL,
    p_action_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_actions_log (admin_id, action_type, target_user_id, action_details)
    VALUES (auth.uid(), p_action_type, p_target_user_id, p_action_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================
-- GRANT PERMISSIONS
-- ====================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ====================================
-- MIGRATION COMPLETE
-- ====================================
-- Run this in Supabase SQL Editor
-- All tables created with RLS policies for security
