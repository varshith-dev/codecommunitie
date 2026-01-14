-- ========================================
-- PASSWORD RESET TOKENS TABLE
-- ========================================
-- Custom password reset with random tokens

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view own tokens
DROP POLICY IF EXISTS "Users can view own reset tokens" ON password_reset_tokens;
CREATE POLICY "Users can view own reset tokens" 
    ON password_reset_tokens FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- ========================================
-- FUNCTION: Generate Password Reset Token
-- ========================================
CREATE OR REPLACE FUNCTION generate_password_reset_token(
    p_user_id UUID,
    p_email TEXT,
    p_expires_hours INT DEFAULT 1
)
RETURNS TEXT AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate secure random token (32 characters)
    v_token := encode(gen_random_bytes(24), 'base64');
    v_token := replace(replace(replace(v_token, '+', ''), '/', ''), '=', '');
    v_token := substring(v_token, 1, 32);
    
    -- Set expiration (1 hour default for security)
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
    
    -- Invalidate any existing unused tokens for this user
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE user_id = p_user_id
        AND used_at IS NULL
        AND expires_at > NOW();
    
    -- Insert new token
    INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
    VALUES (p_user_id, p_email, v_token, v_expires_at);
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Verify Password Reset Token
-- ========================================
CREATE OR REPLACE FUNCTION verify_password_reset_token(
    p_token TEXT
)
RETURNS JSON AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Find valid token
    SELECT * INTO v_record
    FROM password_reset_tokens
    WHERE token = p_token
        AND used_at IS NULL
        AND expires_at > NOW()
    LIMIT 1;
    
    -- Token not found or invalid
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'invalid_token',
            'message', 'Invalid or expired reset link'
        );
    END IF;
    
    -- Return token info (don't mark as used yet - will be marked when password is actually changed)
    RETURN json_build_object(
        'success', true,
        'user_id', v_record.user_id,
        'email', v_record.email,
        'token_id', v_record.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Mark Token as Used
-- ========================================
CREATE OR REPLACE FUNCTION mark_reset_token_used(
    p_token TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE password_reset_tokens
    SET used_at = NOW(),
        ip_address = p_ip_address,
        user_agent = p_user_agent
    WHERE token = p_token
        AND used_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT EXECUTE ON FUNCTION generate_password_reset_token(UUID, TEXT, INT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_password_reset_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_reset_token_used(TEXT, TEXT, TEXT) TO anon, authenticated;
