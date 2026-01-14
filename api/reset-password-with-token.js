// =====================================
// RESET PASSWORD WITH TOKEN API
// Validates token and updates password
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
        const { token, newPassword } = req.body

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token and new password required'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            })
        }

        // Verify token
        const { data: verification, error: verifyError } = await supabase.rpc('verify_password_reset_token', {
            p_token: token
        })

        if (verifyError) throw verifyError

        if (!verification.success) {
            return res.status(400).json({
                success: false,
                error: verification.error,
                message: verification.message
            })
        }

        // Update password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            verification.user_id,
            { password: newPassword }
        )

        if (updateError) throw updateError

        // Mark token as used
        await supabase.rpc('mark_reset_token_used', {
            p_token: token,
            p_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            p_user_agent: req.headers['user-agent']
        })

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        })

    } catch (error) {
        console.error('Password reset error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to reset password'
        })
    }
}
