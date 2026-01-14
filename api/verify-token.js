// =====================================
// VERIFY EMAIL TOKEN API
// Validates token and confirms user email
// =====================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { token } = req.body

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token required'
            })
        }

        // Find token in database
        const { data: tokenData, error: tokenError } = await supabase
            .from('email_verification_tokens')
            .select('*')
            .eq('token', token)
            .is('used_at', null)
            .single()

        if (tokenError || !tokenData) {
            return res.status(400).json({
                success: false,
                error: 'invalid_token',
                message: 'Invalid verification link. Please request a new one.'
            })
        }

        // Check if expired
        const now = new Date()
        const expiresAt = new Date(tokenData.expires_at)

        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'token_expired',
                message: 'This verification link has expired. Please request a new one.'
            })
        }

        // Mark token as used
        const { error: updateError } = await supabase
            .from('email_verification_tokens')
            .update({
                used_at: new Date().toISOString(),
                ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            })
            .eq('id', tokenData.id)

        if (updateError) throw updateError

        // Update user's email_confirmed_at in auth.users
        const { error: authError } = await supabase.auth.admin.updateUserById(
            tokenData.user_id,
            {
                email_confirm: true
            }
        )

        if (authError) {
            console.error('Auth update error:', authError)
            // Continue anyway - token is marked as used
        }

        // Also update via raw SQL to be sure
        await supabase.rpc('confirm_user_email', {
            p_user_id: tokenData.user_id,
            p_email: tokenData.email
        })

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            email: tokenData.email,
            userId: tokenData.user_id
        })

    } catch (error) {
        console.error('Token verification error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify email'
        })
    }
}
