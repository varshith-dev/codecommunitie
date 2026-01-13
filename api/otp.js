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

            await transporter.sendMail({
                from: '"CodeCommunities" <varshith@truvgo.me>',
                to: email,
                subject: "Your Verification Code",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Verify your CodeCommunities Account</h2>
                        <h1 style="background: #f4f4f5; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                    </div>
                `,
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
                const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

                if (!user) return res.status(404).json({ error: 'User account not found' });
                userId = user.id;

                await supabase.from('profiles').insert({
                    id: userId,
                    username: email.split('@')[0],
                    display_name: email.split('@')[0],
                    email: email
                });
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
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Reset Your Password</h2>
                        <h1 style="background: #f4f4f5; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
                    </div>
                `,
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

            // 2. Find User ID (Source of Truth: Auth Users, not Profiles)
            // profiles table might be desynced or contain bad IDs.
            let userId;
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

            if (listError || !users) {
                console.error("ListUsers failed", listError);
                return res.status(500).json({ error: 'System error resolving user.' });
            }

            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (!user) {
                // If user doesn't exist in Auth, we can't reset password.
                return res.status(404).json({ error: 'User account not found' });
            }
            userId = user.id;

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
