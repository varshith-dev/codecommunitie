import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Add CORS headers
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

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    const { email, password, data: userData, redirectTo } = req.body;

    if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }

    try {
        // Initialize Supabase Admin Client
        // Note: These env vars must be set in Vercel
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase credentials in server environment');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                data: userData,
                redirectTo: redirectTo || undefined
            }
        });

        if (error) throw error;

        // prioritize action_link (verify link)
        const actionLink = data.properties?.action_link || data.properties?.email_otp || data.url;

        res.status(200).json({ success: true, link: actionLink });

    } catch (error) {
        console.error("Error generating link:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
