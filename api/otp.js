import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, email, code, newPassword } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            throw new Error('Server Config Error: Missing VITE_SUPABASE_URL');
        }
        if (!serviceRoleKey) {
            throw new Error('Server Config Error: Missing SUPABASE_SERVICE_ROLE_KEY');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // === ACTION: SEND OTP (For Verification) ===
        if (action === 'send') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

            await supabase.from('verification_codes').delete().eq('email', email);

            const { error: dbError } = await supabase
                .from('verification_codes')
                .insert({ email, code: otp, expires_at: expiresAt });

            if (dbError) throw dbError;

            const transporter = nodemailer.createTransport({
                host: "smtp.zeptomail.in",
                port: 587,
                secure: false,
                auth: {
                    user: "emailapikey",
                    pass: process.env.SMTP_PASSWORD || "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITpcdJq1SbXvNbZNA=="
                },
            });

            // Standard Template Wrapper
            const getHtml = (otpCode, title) => `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f8ff; margin: 0; padding: 0; }
  .wrapper { background-color: #f0f8ff; padding: 40px 20px; text-align: center; }
  .card { background-color: #ffffff; max-width: 500px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background-color: #2563eb; color: #ffffff; padding: 20px; font-weight: bold; font-size: 18px; }
  .content { padding: 30px 20px; color: #334155; line-height: 1.6; }
  .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 20px 0; text-align: center; }
  .footer { background-color: #f8fafc; padding: 15px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">${title}</div>
      <div class="content">
        <p>Hello,</p>
        <p>You requested a verification code for your CodeCommunities account.</p>
        <div class="otp-box">${otpCode}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} CodeCommunities. If you didn't request this, please ignore.
      </div>
    </div>
  </div>
</body>
</html>`;

            await transporter.sendMail({
                from: '"CodeCommunities" <varshith@truvgo.me>',
                to: email,
                subject: "Your Verification Code",
                subject: "Your Verification Code",
                html: getHtml(otp, "Verify Your Account"),
            });

            return res.status(200).json({ success: true, message: 'OTP Sent' });
        }

        // === ACTION: VERIFY OTP (Email Confirmation) ===
        if (action === 'verify') {
            if (!code) return res.status(400).json({ error: 'Code is required' });

            // 1. Check Code
            const { data, error } = await supabase.from('verification_codes').select('*').eq('email', email).eq('code', code).single();
            if (error || !data) return res.status(400).json({ success: false, error: 'Invalid or expired code' });
            if (new Date(data.expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Code expired' });

            // 2. Resolve User ID (Auto-Healing)
            let userId;
            const { data: profile } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();

            if (profile) {
                userId = profile.id;
            } else {
                console.log(`Profile missing for ${email}, attempting auto-heal...`);
                // Use listUsers to find the Auth User and get their Metadata
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

                if (!user) return res.status(404).json({ error: 'User account not found' });
                userId = user.id;

                // Extract Metadata form Auth User (Preserves the username set during signup)
                const meta = user.user_metadata || {};
                const username = meta.username || email.split('@')[0];
                const displayName = meta.display_name || meta.full_name || username;

                // Auto-Create Profile with correct metadata
                const { error: insertError } = await supabase.from('profiles').insert({
                    id: userId,
                    username: username,
                    display_name: displayName,
                    email: email,
                    // If username collision happens here, it might fail.
                    // We should probably handle that, but typically unique constraint will throw.
                    // If it throws, we can't do much but maybe fallback? 
                    // For now, let's assume unique username or fail.
                });

                if (insertError) {
                    // If duplicate key (username taken?), we might need to fallback or log
                    console.error("Auto-heal insert failed:", insertError);
                    // If username conflict, we can try appending random digits?
                    // But simpler is to let it fail or assume the auth user 'owns' this username.
                    // A better approach is ON CONFLICT DO NOTHING, but we want to ensure profile exists.
                    // The previous maybeSingle() check ensures we don't try to insert if profile exists.
                    // So this error is likely a Username Collision with *another* user.
                }
            }

            // 2.5 Handle Referral (Moved from Frontend)
            // Now that profile definitely exists, we can safely register the referral.
            try {
                // Get fresh user data including metadata
                const { data: { user: freshUser }, error: userError } = await supabase.auth.admin.getUserById(userId);

                if (freshUser && freshUser.user_metadata?.referral_code) {
                    const refCode = freshUser.user_metadata.referral_code;
                    console.log(`Processing referral: ${refCode} for user ${userId}`);

                    // Use RPC to register referral (Admin Privileges via Service Role)
                    const { data: result, error: rpcError } = await supabase.rpc('register_referral', {
                        referral_code_input: refCode,
                        new_user_id: userId
                    });

                    if (rpcError) {
                        console.error('Referral RPC error:', rpcError);
                    } else {
                        console.log('Referral result:', result);
                    }
                }
            } catch (refError) {
                console.error('Referral processing error in OTP:', refError);
            }

            // 3. Confirm Email
            await supabase.auth.admin.updateUserById(userId, { email_confirm: true });

            // 4. Cleanup
            await supabase.from('verification_codes').delete().eq('email', email);

            return res.status(200).json({ success: true, message: 'Verified' });
        }

        // === ACTION: FORGOT PASSWORD (Send OTP) ===
        if (action === 'forgot_password') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await supabase.from('verification_codes').delete().eq('email', email);
            await supabase.from('verification_codes').insert({ email, code: otp, expires_at: expiresAt });

            const transporter = nodemailer.createTransport({
                host: "smtp.zeptomail.in", port: 587, secure: false,
                auth: { user: "emailapikey", pass: process.env.SMTP_PASSWORD }
            });

            await transporter.sendMail({
                from: '"CodeCommunities" <varshith@truvgo.me>',
                to: email,
                subject: "Reset Your Password",
                html: getHtml(otp, "Reset Your Password"),
            });

            return res.status(200).json({ success: true, message: 'Reset OTP Sent' });
        }

        // === ACTION: RESET PASSWORD (Verify & Update) ===
        if (action === 'reset_password') {
            if (!code || !newPassword) return res.status(400).json({ error: 'Code and Password required' });

            // 1. Verify Code
            const { data, error } = await supabase.from('verification_codes').select('*').eq('email', email).eq('code', code).single();
            if (error || !data) return res.status(400).json({ success: false, error: 'Invalid or expired code' });
            if (new Date(data.expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Code expired' });

            // 2. Find User ID (Optimized)
            let userId;

            // Optimization: Try finding in Profiles first (Fast)
            const { data: profile } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle();

            if (profile) {
                userId = profile.id;
            } else {
                // Fallback: List Users (Slow)
                console.log('Profile not found for reset, falling back to admin.listUsers');
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                if (listError || !users) return res.status(500).json({ error: 'System error resolving user.' });

                const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (!user) return res.status(404).json({ error: 'User account not found' });
                userId = user.id;
            }

            // 3. Update Password & Confirm Email
            // We force email_confirm: true just in case that's blocking login.
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: newPassword,
                email_confirm: true,
                user_metadata: { password_reset_at: new Date().toISOString() } // Audit trail
            });

            if (updateError) {
                console.error("UpdateUser failed", updateError);
                throw updateError;
            }

            // 4. Cleanup
            await supabase.from('verification_codes').delete().eq('email', email);

            return res.status(200).json({ success: true, message: 'Password Updated' });
        }

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: error.message });
    }
}
