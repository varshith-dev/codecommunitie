import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Server Config Error: Missing Supabase keys');
        }

        // 1. Verify Authentication
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Verify the user's token directly with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const userId = user.id;
        console.log(`Processing account deletion for user: ${userId}`);

        // 2. Perform Deletion
        // Delete from public tables first (Optional if Cascade works, but good for safety)
        // Note: Admin deleteUser should handle auth.users. 
        // We might need to manually delete profiles if CASCADE is not set on the FK.
        // Let's attempt profile deletion first just in case.
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) {
            console.warn('Profile deletion warning:', profileError);
            // Continue anyway to ensure auth deletion
        }

        // Delete from Auth (The Real Deletion)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        console.log(`Successfully deleted user ${userId}`);
        return res.status(200).json({ success: true, message: 'Account permanently deleted' });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
