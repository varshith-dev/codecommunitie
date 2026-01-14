import { supabase } from '../supabaseClient'

/**
 * Email Service - Refactored to use Supabase Auth
 * No backend API server required!
 */
export const EmailService = {
    /**
     * Send OTP Code using Supabase Auth
     * Supabase automatically sends the OTP email if SMTP is configured
     */
    sendOTP: async (email) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false // Don't create new user, just send OTP
                }
            })

            if (error) throw error
            return { success: true, message: 'OTP sent successfully' }
        } catch (error) {
            console.error('Send OTP error:', error)
            throw new Error(error.message || 'Failed to send OTP')
        }
    },

    /**
     * Verify OTP Code using Supabase Auth
     */
    verifyOTP: async (email, token) => {
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email'
            })

            if (error) throw error
            return {
                success: true,
                message: 'Verified successfully',
                user: data.user,
                session: data.session
            }
        } catch (error) {
            console.error('Verify OTP error:', error)
            throw new Error(error.message || 'Failed to verify OTP')
        }
    },

    /**
     * Send Password Reset Email using Supabase Auth
     * Supabase automatically sends reset link email
     */
    sendResetOTP: async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            })

            if (error) throw error
            return { success: true, message: 'Password reset email sent' }
        } catch (error) {
            console.error('Send reset email error:', error)
            throw new Error(error.message || 'Failed to send reset email')
        }
    },

    /**
     * Reset Password - Use Supabase's session-based reset
     * This method is called after user clicks the reset link in email
     */
    resetPasswordWithOTP: async (email, code, newPassword) => {
        try {
            // First verify the OTP/code
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'recovery'
            })

            if (verifyError) throw verifyError

            // Then update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) throw updateError

            return { success: true, message: 'Password updated successfully' }
        } catch (error) {
            console.error('Reset password error:', error)
            throw new Error(error.message || 'Failed to reset password')
        }
    },
    /**
     * Send custom emails (for admin features)
     * Note: This requires Supabase SMTP to be configured or will log as failed
     * For production, consider using Supabase Edge Functions with Resend
     */
    send: async ({ recipientEmail, memberName, subject, htmlContent, templateType = 'CUSTOM', triggeredBy = 'admin' }) => {
        let status = 'sent'
        let errorMessage = null

        try {
            // For now, we log the intent to send
            // In production, you should set up Supabase SMTP or use Edge Functions
            console.warn('Custom email send requested. Configure Supabase SMTP or create Edge Function for actual delivery.')
            console.log('Email details:', { recipientEmail, subject, templateType })

            // You can implement actual sending here using:
            // 1. Supabase SMTP (if configured)
            // 2. Supabase Edge Function with Resend
            // 3. Third-party email service

            status = 'pending' // Mark as pending until you implement actual sending

        } catch (error) {
            console.error('EmailService Send Error:', error)
            status = 'failed'
            errorMessage = error.message
        } finally {
            // Log to Supabase for tracking
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
     * Get stats for the dashboard.
     */
    getStats: async () => {
        const { count: total } = await supabase.from('email_logs').select('*', { count: 'exact', head: true })
        const { count: sent } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'sent')
        const { count: failed } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).eq('status', 'failed')

        return { total: total || 0, sent: sent || 0, failed: failed || 0 }
    }
}
