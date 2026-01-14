-- ========================================
-- SECURE EMAIL VERIFICATION TOKENS TABLE
-- ========================================
-- Generate unique, secure, time-limited verification links

CREATE TABLE IF NOT EXISTS email_verification_tokens (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON email_verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON email_verification_tokens;
CREATE POLICY "Users can view own tokens" 
    ON email_verification_tokens FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- ========================================
-- FUNCTION: Generate Secure Token
-- ========================================
CREATE OR REPLACE FUNCTION generate_verification_token(
    p_user_id UUID,
    p_email TEXT,
    p_expires_hours INT DEFAULT 24
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
    
    -- Set expiration
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
    
    -- Insert token
    INSERT INTO email_verification_tokens (user_id, email, token, expires_at)
    VALUES (p_user_id, p_email, v_token, v_expires_at);
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Verify Token and Confirm Email
-- ========================================
CREATE OR REPLACE FUNCTION verify_email_token(
    p_token TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_record RECORD;
    v_result JSON;
BEGIN
    -- Find valid token
    SELECT * INTO v_record
    FROM email_verification_tokens
    WHERE token = p_token
        AND used_at IS NULL
        AND expires_at > NOW()
    LIMIT 1;
    
    -- Token not found or invalid
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'invalid_token',
            'message', 'Invalid or expired verification link'
        );
    END IF;
    
    -- Mark token as used
    UPDATE email_verification_tokens
    SET used_at = NOW(),
        ip_address = p_ip_address,
        user_agent = p_user_agent
    WHERE id = v_record.id;
    
    -- Verify email in auth.users
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = v_record.user_id
        AND email = v_record.email
        AND email_confirmed_at IS NULL;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'user_id', v_record.user_id,
        'email', v_record.email,
        'message', 'Email verified successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Cleanup Expired Tokens
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM email_verification_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT EXECUTE ON FUNCTION generate_verification_token(UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_token(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_verification_tokens() TO authenticated;

-- ========================================
-- FUNCTION: Confirm User Email
-- ========================================
CREATE OR REPLACE FUNCTION confirm_user_email(
    p_user_id UUID,
    p_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update email_confirmed_at in auth.users
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = p_user_id
        AND email = p_email
        AND email_confirmed_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION confirm_user_email(UUID, TEXT) TO authenticated, anon;
