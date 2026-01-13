-- =============================================
-- ADMIN FEATURE MANAGEMENT SYSTEM
-- =============================================

-- Feature flags table for global feature toggles
CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    is_beta BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific feature access (for beta/premium features)
CREATE TABLE IF NOT EXISTS user_feature_access (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_id TEXT REFERENCES feature_flags(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    PRIMARY KEY (user_id, feature_id)
);

-- App releases/updates changelog
CREATE TABLE IF NOT EXISTS app_releases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    release_notes TEXT,
    is_published BOOLEAN DEFAULT false,
    is_major BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Add admin label column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS admin_label TEXT;

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read feature flags
DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
CREATE POLICY "Anyone can read feature flags" ON feature_flags
    FOR SELECT USING (true);

-- RLS: Only admins can manage feature flags
DROP POLICY IF EXISTS "Admins can manage feature flags" ON feature_flags;
CREATE POLICY "Admins can manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: Users can read their own feature access
DROP POLICY IF EXISTS "Users can read own feature access" ON user_feature_access;
CREATE POLICY "Users can read own feature access" ON user_feature_access
    FOR SELECT USING (user_id = auth.uid());

-- RLS: Admins can manage all feature access
DROP POLICY IF EXISTS "Admins can manage feature access" ON user_feature_access;
CREATE POLICY "Admins can manage feature access" ON user_feature_access
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: Anyone can read published releases
DROP POLICY IF EXISTS "Anyone can read published releases" ON app_releases;
CREATE POLICY "Anyone can read published releases" ON app_releases
    FOR SELECT USING (is_published = true);

-- RLS: Admins can read all releases
DROP POLICY IF EXISTS "Admins can read all releases" ON app_releases;
CREATE POLICY "Admins can read all releases" ON app_releases
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: Admins can manage releases
DROP POLICY IF EXISTS "Admins can manage releases" ON app_releases;
CREATE POLICY "Admins can manage releases" ON app_releases
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS: Admins can update post admin_label
DROP POLICY IF EXISTS "Admins can update admin labels" ON posts;
CREATE POLICY "Admins can update admin labels" ON posts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Insert default feature flags
INSERT INTO feature_flags (id, name, description, is_enabled, is_beta) VALUES
    ('referrals', 'Referral Program', 'Allow users to invite friends', true, true),
    ('dark_mode', 'Dark Mode', 'Enable dark mode theme', false, true),
    ('scheduled_posts', 'Scheduled Posts', 'Allow scheduling posts for later', true, false),
    ('code_snippets', 'Code Snippets', 'Syntax highlighted code blocks', true, false),
    ('verification', 'User Verification', 'Blue checkmark verification system', true, false)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_feature_access_user ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS idx_app_releases_published ON app_releases(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_posts_admin_label ON posts(admin_label);
