import { supabase } from '../supabaseClient'

// API URLs - In production (Vercel), uses /api routes as serverless functions
// In development, you can run the API locally or use production API
const API_BASE_URL = import.meta.env.PROD
    ? '/api'  // Production: Vercel serverless functions
    : import.meta.env.VITE_API_URL || 'https://codecommunitie.vercel.app/api' // Development: use production API by default

const SEND_EMAIL_URL = `${API_BASE_URL}/send-email`
const GENERATE_LINK_URL = `${API_BASE_URL}/generate-link`
const OTP_URL = `${API_BASE_URL}/otp`

export const EmailService = {
    /**
     * Send OTP Code
     */
    sendOTP: async (email) => {
        const response = await fetch(OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send', email })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
        return data
    },

    /**
     * Verify OTP Code
     */
    verifyOTP: async (email, code) => {
        const response = await fetch(OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', email, code })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to verified OTP')
        return data
    },

    /**
     * Send Password Reset OTP
     */
    sendResetOTP: async (email) => {
        const response = await fetch(OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'forgot_password', email })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to send Reset OTP')
        return data
    },

    /**
     * Verify Password Reset OTP
     */
    verifyResetOTP: async (email, code) => {
        const response = await fetch(OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify_reset', email, code })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Invalid or expired code')
        return data
    },

    /**
     * Reset Password with OTP
     */
    resetPasswordWithOTP: async (email, code, newPassword) => {
        const response = await fetch(OTP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_password', email, code, newPassword })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to reset password')
        return data
    },
    /**
     * Sends an email via the local Python backend and logs it to Supabase.
     * @param {Object} params - { recipientEmail, memberName, subject, htmlContent, templateType, triggeredBy, attachments }
     */
    send: async (params) => {
        const { recipientEmail, memberName, subject, htmlContent, templateType = 'CUSTOM', triggeredBy = 'admin' } = params
        let status = 'sent'
        let errorMessage = null

        try {
            // 1. Send via Backend (Python local or Vercel Prod)
            const response = await fetch(SEND_EMAIL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientEmail,
                    memberName, // Optional, for backend logging/fallback
                    subject,
                    htmlContent,
                    attachments: params.attachments || [] // Attachments support
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send via backend')
            }

        } catch (error) {
            console.error('EmailService Send Error:', error)
            status = 'failed'
            errorMessage = error.message
            throw error // Re-throw to let the UI know
        } finally {
            // 2. Log to Supabase (Fire and Forget)
            try {
                await supabase.from('email_logs').insert({
                    recipient_email: recipientEmail,
                    subject: subject,
                    status: status,
                    template_type: templateType,
                    triggered_by: triggeredBy,
                    error_message: errorMessage
                })
            } catch (logError) {
                console.error('Failed to log email to Supabase:', logError)
            }
        }
    },

    /**
     * Fetches the email history logs.
     */
    getHistory: async () => {
        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) throw error
        return data
    },

    /**
     * Generates a Supabase Verification Link via the Backend.
     */
    generateVerificationLink: async (email, redirectTo) => {
        try {
            const response = await fetch(GENERATE_LINK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, redirectTo })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.message || 'Failed to generate link')

            return data.link
        } catch (error) {
            console.error('Failed to generate verification link:', error)
            return null // Fallback to generic if fails
        }
    },

    /**
     * Get stats for the dashboard.
     */
    getStats: async () => {
        // Fetch specifically for counts. This is a naive implementation.
        // Ideally use .count() with filters.
        const { count: total } = await supabase.from('email_logs').select('*', { count: 'exact', head: true })
        const { count: sent } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'sent')
        const { count: failed } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed')

        return { total: total || 0, sent: sent || 0, failed: failed || 0 }
    }
}
