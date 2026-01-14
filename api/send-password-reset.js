// =====================================
// SEND PASSWORD RESET EMAIL API
// Custom password reset with dynamic tokens
// =====================================

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email required' })
        }

        // Find user by email
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()

        const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (!user) {
            // Don't reveal if user exists or not (security)
            return res.status(200).json({
                success: true,
                message: 'If an account exists, a reset link will be sent'
            })
        }

        // Generate secure random token
        const { data: token, error: tokenError } = await supabase.rpc('generate_password_reset_token', {
            p_user_id: user.id,
            p_email: email,
            p_expires_hours: 1
        })

        if (tokenError) throw tokenError

        // Generate reset URL
        const baseUrl = process.env.VITE_APP_URL || 'https://codecommunitie.vercel.app'
        const resetUrl = `${baseUrl}/reset-password?token=${token}`

        // Send email via your email service
        const nodemailer = require('nodemailer')

        const transporter = nodemailer.createTransport({
            host: 'smtp.zeptomail.in',
            port: 587,
            secure: false,
            auth: {
                user: 'emailapikey',
                pass: process.env.SMTP_PASSWORD
            }
        })

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; font-size: 28px; margin-bottom: 10px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #2d3748; font-size: 22px; margin-bottom: 20px; }
        .content p { color: #4a5568; line-height: 1.6; margin-bottom: 15px; }
        .button-container { text-align: center; margin: 35px 0; }
        .button { display: inline-block; background: #667eea; color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 4px; }
        .alert strong { color: #856404; display: block; margin-bottom: 5px; }
        .alert p { color: #856404; font-size: 14px; margin: 0; }
        .link-box { background: #f7fafc; border: 2px dashed #cbd5e0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .link-box p { font-size: 12px; color: #718096; word-break: break-all; margin: 0; font-family: monospace; }
        .security { background: #fee; border: 1px solid #fdd; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .security h3 { color: #c53030; font-size: 16px; margin-bottom: 10px; }
        .security ul { color: #742a2a; font-size: 14px; line-height: 1.8; margin-left: 20px; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 13px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Reset your password securely</p>
        </div>
        
        <div class="content">
            <h2>Hi there!</h2>
            <p>We received a request to reset your password for <strong>${email}</strong>. If you didn't make this request, you can safely ignore this email.</p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="alert">
                <strong>⏰ Link Expires in 1 Hour</strong>
                <p>This password reset link is valid for 1 hour and can only be used once. After that, you'll need to request a new one.</p>
            </div>
            
            <div class="security">
                <h3>⚠️ Security Notice</h3>
                <ul>
                    <li>This link is unique to your account (${email})</li>
                    <li>Single-use only - becomes invalid after password reset</li>
                    <li>Automatic expiration after 1 hour</li>
                    <li>If you didn't request this, your account may be at risk</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px;"><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
            <div class="link-box">
                <p>${resetUrl}</p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
                <strong>Didn't request a password reset?</strong><br>
                If you didn't initiate this request, please secure your account immediately. Someone may have tried to access your account.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>CodeCommunities</strong></p>
            <p>Share Code • Build Community • Learn Together</p>
            <p style="margin-top: 15px; font-size: 11px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
        `

        await transporter.sendMail({
            from: '"CodeCommunities Security" <varshith@truvgo.me>',
            to: email,
            subject: '🔐 Reset Your Password - CodeCommunities',
            html: emailHtml
        })

        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        })

    } catch (error) {
        console.error('Password reset email error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send password reset email'
        })
    }
}
