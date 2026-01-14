import { supabase } from '../supabaseClient'

/**
 * Secure Email Verification Service
 * Generates dynamic, secure verification links for each user
 */

/**
 * Generate a secure verification link for a user
 * @param {string} userId - User's UUID
 * @param {string} email - User's email address
 * @param {number} expiresHours - Link expiration in hours (default: 24)
 * @returns {Promise<{success: boolean, verificationUrl: string, token: string}>}
 */
export async function generateVerificationLink(userId, email, expiresHours = 24) {
    try {
        // Call Supabase function to generate secure token
        const { data, error } = await supabase.rpc('generate_verification_token', {
            p_user_id: userId,
            p_email: email,
            p_expires_hours: expiresHours
        })

        if (error) throw error

        const token = data
        const baseUrl = window.location.origin
        const verificationUrl = `${baseUrl}/verify-email?token=${token}`

        return {
            success: true,
            verificationUrl,
            token,
            expiresIn: `${expiresHours} hours`
        }
    } catch (error) {
        console.error('Error generating verification link:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Verify email using token from URL
 * @param {string} token - Verification token from URL
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyEmailWithToken(token) {
    try {
        // Get client info for security logging
        const ipAddress = await fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => d.ip)
            .catch(() => null)

        const userAgent = navigator.userAgent

        // Call verification function
        const { data, error } = await supabase.rpc('verify_email_token', {
            p_token: token,
            p_ip_address: ipAddress,
            p_user_agent: userAgent
        })

        if (error) throw error

        return data // Returns {success, error, message, user_id, email}
    } catch (error) {
        console.error('Error verifying token:', error)
        return {
            success: false,
            error: 'verification_failed',
            message: error.message || 'Failed to verify email'
        }
    }
}

/**
 * Send verification email with secure dynamic link
 * @param {string} email - User's email
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean}>}
 */
export async function sendVerificationEmail(email, userId) {
    try {
        // Generate secure verification link
        const { success, verificationUrl, error } = await generateVerificationLink(userId, email)

        if (!success) throw new Error(error)

        // Send email via your backend API
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                subject: 'Verify Your Email - CodeCommunities',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                            .header h1 { color: white; margin: 0; }
                            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
                            .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                            .button:hover { background: #5568d3; }
                            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎉 Welcome to CodeCommunities!</h1>
                            </div>
                            <div class="content">
                                <h2>Verify Your Email Address</h2>
                                <p>Hi there! 👋</p>
                                <p>Thanks for signing up at CodeCommunities! To get started, please verify your email address by clicking the button below:</p>
                                
                                <div style="text-align: center;">
                                    <a href="${verificationUrl}" class="button">✓ Verify Email Address</a>
                                </div>
                                
                                <div class="warning">
                                    <strong>⏰ This link will expire in 24 hours</strong><br>
                                    This verification link is unique to your account and can only be used once.
                                </div>
                                
                                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                                <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                                    ${verificationUrl}
                                </p>
                                
                                <p style="margin-top: 30px; color: #666;">
                                    <strong>Didn't create an account?</strong><br>
                                    If you didn't sign up for CodeCommunities, you can safely ignore this email.
                                </p>
                            </div>
                            <div class="footer">
                                <p>CodeCommunities - Share Code, Build Community</p>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        })

        if (!response.ok) throw new Error('Failed to send email')

        return { success: true, verificationUrl }
    } catch (error) {
        console.error('Error sending verification email:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Resend verification email
 * @param {string} email - User's email
 */
export async function resendVerificationEmail(email) {
    try {
        // Get user by email
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            throw new Error('User not found. Please login first.')
        }

        // Check if already verified
        if (user.email_confirmed_at) {
            return {
                success: false,
                error: 'already_verified',
                message: 'Your email is already verified'
            }
        }

        // Send new verification email
        return await sendVerificationEmail(email || user.email, user.id)
    } catch (error) {
        console.error('Error resending verification:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
