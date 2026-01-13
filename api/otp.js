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

    const { action, email, code } = req.body;

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

        // === ACTION: SEND OTP ===
        if (action === 'send') {
            // 1. Generate 6-digit Code
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

            // 2. Store in DB (Delete old codes first)
            await supabase.from('verification_codes').delete().eq('email', email);

            const { error: dbError } = await supabase
                .from('verification_codes')
                .insert({ email, code: otp, expires_at: expiresAt });

            if (dbError) throw dbError;

            // 3. Send Email via Nodemailer
            const transporter = nodemailer.createTransport({
                host: "smtp.zeptomail.in",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: "emailapikey",
                    pass: process.env.SMTP_PASSWORD || "PHtE6r0KF7/s2TEt8BVStvG8EMGsZt59/75uK1FGt95AX/ADHk1Wq9F6wza2+U8jAaFFFvbPzIJuuemet7+BcGu4Nz1IDWqyqK3sx/VYSPOZsbq6x00UsFkTckHfXITpcdJq1SbXvNbZNA=="
                },
            });

            // Read Template or use basic HTML
            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify your CodeCommunities Account</h2>
                    <p>Your verification code is:</p>
                    <h1 style="background: #f4f4f5; padding: 20px; font-size: 32px; letter-spacing: 5px; text-align: center; border-radius: 10px;">${otp}</h1>
                    <p>This code expires in 10 minutes.</p>
                </div>
            `;

            await transporter.sendMail({
                from: '"CodeCommunities" <varshith@truvgo.me>',
                to: email,
                subject: "Your Verification Code",
                html: htmlContent,
            });

            return res.status(200).json({ success: true, message: 'OTP Sent' });
        }

        // === ACTION: VERIFY OTP ===
        if (action === 'verify') {
            if (!code) return res.status(400).json({ error: 'Code is required' });

            // 1. Check DB
            const { data, error } = await supabase
                .from('verification_codes')
                .select('*')
                .eq('email', email)
                .eq('code', code)
                .single();

            if (error || !data) {
                return res.status(400).json({ success: false, error: 'Invalid or expired code' });
            }

            // Check Expiry
            if (new Date(data.expires_at) < new Date()) {
                return res.status(400).json({ success: false, error: 'Code expired' });
            }

            // 2. Confirm User in Supabase Auth
            const { data: userData, error: userError } = await supabase
                .from('auth.users') // Wait, need Admin API to find user by email first?
            // supabase-js admin can verify user
            // Actually `admin.updateUserById` needs ID.
            // admin.listUsers?
            // Let's use `confirmUser` logic? Not exposed.

            // Find user ID
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            // This is inefficient if many users.
            // Better: `supabase.auth.admin.getUserByEmail(email)`? No such method?
            // Actually `supabase.rpc`?
            // Let's try:

            // 2. Confirm User in Supabase Auth & Get Profile ID
            let userId;

            // Try explicit lowercased email lookup in profiles first
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email.toLowerCase()) // Try lowercase first
                .maybeSingle(); // Use maybeSingle to avoid error on null

            if (profile) {
                userId = profile.id;
            } else {
                // FALLBACK: Profile missing? Try to find user in Auth Admin & Auto-Heal
                console.log(`Profile missing for ${email}, attempting auto-heal...`);

                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

                if (listError || !users) {
                    console.error("ListUsers failed", listError);
                    return res.status(500).json({ error: 'Failed to retrieve user directory' });
                }

                const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

                if (!user) {
                    return res.status(404).json({ error: 'User account not found. Please Sign Up.' });
                }

                userId = user.id;

                // Auto-Create Profile
                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        username: email.split('@')[0],
                        display_name: email.split('@')[0],
                        email: email // Store email in profile for easier lookup later
                    });

                if (createProfileError) {
                    // Ignore duplicate key error if race condition
                    if (!createProfileError.message.includes('duplicate')) {
                        console.error("Auto-heal profile failed", createProfileError);
                    }
                } else {
                    console.log(`Auto-healed profile for ${userId}`);
                }
            }

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                userId,
                { email_confirm: true }
            );

            if (updateError) throw updateError;

            // 3. Cleanup
            await supabase.from('verification_codes').delete().eq('email', email);

            return res.status(200).json({ success: true, message: 'Verified' });
        }

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: error.message });
    }
}
