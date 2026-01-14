import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // Add CORS headers (Critical for cross-origin requests if needed, though usually same-origin)
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed' })
        return
    }

    const { userIds } = req.body

    if (!userIds || !Array.isArray(userIds)) {
        res.status(400).json({ message: 'Invalid payload: userIds must be an array' })
        return
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase Service Key in Environment Variables')
        res.status(500).json({
            message: 'Server Configuration Error: Missing Admin Keys. Please add SUPABASE_SERVICE_ROLE_KEY to Vercel Env Variables.'
        })
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // Perform Deletions
    const results = []
    let failureCount = 0

    try {
        for (const id of userIds) {
            // Delete user from Auth (Cascades to profiles usually, but we handle it)
            const { error } = await supabase.auth.admin.deleteUser(id)

            if (error) {
                console.error(`Failed to delete user ${id}:`, error)
                results.push({ id, status: 'failed', error: error.message })
                failureCount++
            } else {
                results.push({ id, status: 'success' })
            }
        }

        if (failureCount === userIds.length) {
            res.status(500).json({ message: 'All deletions failed', results })
        } else {
            res.status(200).json({ message: 'Deletion process completed', results })
        }

    } catch (err) {
        console.error('Unexpected error in delete handler:', err)
        res.status(500).json({ message: 'Internal Server Error', error: err.message })
    }
}
