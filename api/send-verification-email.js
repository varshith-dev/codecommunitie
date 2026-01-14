// =====================================
// CUSTOM EMAIL VERIFICATION API
// Generates secure, time-limited verification links
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
        const { email, userId } = req.body

        if (!email || !userId) {
            return res.status(400).json({ error: 'Email and userId required' })
        }

        // Generate secure random token (32 characters)
        const token = crypto.randomBytes(32).toString('hex')

        // Set expiration (24 hours from now)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24)

        // Store token in database
        const { error: dbError } = await supabase
            .from('email_verification_tokens')
            .insert({
                user_id: userId,
                email: email,
                token: token,
                expires_at: expiresAt.toISOString()
            })

        if (dbError) throw dbError

        // Generate verification URL
        const baseUrl = process.env.VITE_APP_URL || 'https://codecommunitie.vercel.app'
        const verificationUrl = `${baseUrl}/verify?token=${token}`

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
        .button { display: inline-block; background: #667eea; color: white !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s; }
        .button:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5); }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 25px 0; border-radius: 4px; }
        .alert strong { color: #856404; display: block; margin-bottom: 5px; }
        .alert p { color: #856404; font-size: 14px; margin: 0; }
        .link-box { background: #f7fafc; border: 2px dashed #cbd5e0; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .link-box p { font-size: 12px; color: #718096; word-break: break-all; margin: 0; font-family: monospace; }
        .security { background: #e6fffa; border: 1px solid #81e6d9; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .security h3 { color: #234e52; font-size: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .security ul { color: #2c7a7b; font-size: 14px; line-height: 1.8; margin-left: 20px; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 13px; margin: 5px 0; }
        .footer a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to CodeCommunities!</h1>
            <p>One more step to get started</p>
        </div>
        
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi there! 👋</p>
            <p>Thanks for signing up with <strong>${email}</strong>. To activate your account and start sharing amazing code, please verify your email address.</p>
            
            <div class="button-container">
                <a href="${verificationUrl}" class="button">✓ Verify My Email Address</a>
            </div>
            
            <div class="alert">
                <strong>⏰ Link Expires in 24 Hours</strong>
                <p>This verification link is valid for 24 hours and can only be used once. After verification, you can log in immediately.</p>
            </div>
            
            <div class="security">
                <h3>🔒 Security Features</h3>
                <ul>
                    <li>Unique token generated specifically for ${email}</li>
                    <li>Single-use only - link becomes invalid after verification</li>
                    <li>Automatic expiration after 24 hours</li>
                    <li>Secure encrypted connection</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px;"><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
            <div class="link-box">
                <p>${verificationUrl}</p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
                <strong>Didn't create an account?</strong><br>
                If you didn't sign up for CodeCommunities, you can safely ignore this email. Your email address will not be used.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>CodeCommunities</strong></p>
            <p>Share Code • Build Community • Learn Together</p>
            <p style="margin-top: 15px;">
                <a href="${baseUrl}">Visit Website</a> • 
                <a href="${baseUrl}/privacy">Privacy Policy</a> • 
                <a href="${baseUrl}/terms">Terms of Service</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
        `

        await transporter.sendMail({
            from: '"CodeCommunities" <varshith@truvgo.me>',
            to: email,
            subject: '✓ Verify Your Email - CodeCommunities',
            html: emailHtml
        })

        res.status(200).json({
            success: true,
            message: 'Verification email sent',
            verificationUrl, // For testing/development
            expiresAt: expiresAt.toISOString()
        })

    } catch (error) {
        console.error('Verification email error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send verification email'
        })
    }
}
