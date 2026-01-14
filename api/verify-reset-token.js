// =====================================
// VERIFY RESET TOKEN API
// Just checks if token is valid
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

        // Verify token
        const { data: verification, error } = await supabase.rpc('verify_password_reset_token', {
            p_token: token
        })

        if (error) throw error

        res.status(200).json(verification)

    } catch (error) {
        console.error('Token verification error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to verify token'
        })
    }
}
