import { supabase } from '../supabaseClient'

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000'
const SEND_EMAIL_URL = `${API_BASE_URL}/send-email`
const GENERATE_LINK_URL = `${API_BASE_URL}/generate-link`

export const EmailService = {
    /**
     * Sends an email via the local Python backend and logs it to Supabase.
     * @param {Object} params - { recipientEmail, memberName, subject, htmlContent, templateType, triggeredBy }
     */
    send: async ({ recipientEmail, memberName, subject, htmlContent, templateType = 'CUSTOM', triggeredBy = 'admin' }) => {
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
                    htmlContent
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
