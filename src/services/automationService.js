import { supabase } from '../supabaseClient'

/**
 * Checks and triggers automations for a specific user and event type.
 * @param {string} userId - The ID of the user.
 * @param {string} triggerType - The type of trigger (e.g., 'new_user', 'login', 'create_post', 'incomplete_profile').
 * @param {object} additionalContext - Optional context data (e.g., email for sending).
 */
export const checkAndTriggerAutomations = async (userId, triggerType, additionalContext = {}) => {
    try {
        console.log(`Checking automations: ${triggerType} for user ${userId}`)

        // 1. Fetch active automations for this type
        const { data: automations, error } = await supabase
            .from('prompt_automations')
            .select('*')
            .eq('trigger_type', triggerType)
            .eq('is_active', true)

        if (error) throw error
        if (!automations || automations.length === 0) return

        // 2. Specialized Checks
        // For 'incomplete_profile', we double-check if the profile is actually incomplete
        if (triggerType === 'incomplete_profile') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username, bio, website, avatar_url')
                .eq('id', userId)
                .single()

            if (profile) {
                // Define what "Incomplete" means
                const isComplete = profile.username && profile.bio && profile.avatar_url
                if (isComplete) {
                    console.log('Profile is complete, skipping incomplete_profile automation.')
                    return
                }
            }
        }

        // 3. Execute Automations
        for (const auto of automations) {
            // SPAM PREVENTION: Check if we already sent this specific prompt recently (e.g. last 24h) or if it's currently unread
            // We can match by title match for now
            const { data: existing } = await supabase
                .from('user_prompts')
                .select('id, created_at, is_read')
                .eq('user_id', userId)
                .eq('title', auto.title)
                .order('created_at', { ascending: false })
                .limit(1)

            if (existing && existing.length > 0) {
                const lastPrompt = existing[0]
                // If unread, definitely don't send again
                if (!lastPrompt.is_read) {
                    console.log(`Skipping duplicate unread prompt: ${auto.title}`)
                    continue
                }

                // If read but very recent (e.g. < 1 day), maybe skip? 
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
                if (new Date(lastPrompt.created_at) > oneDayAgo) {
                    console.log(`Skipping recently sent prompt: ${auto.title}`)
                    continue
                }
            }

            // A. Insert In-App Prompt
            const { error: insertError } = await supabase
                .from('user_prompts')
                .insert({
                    user_id: userId,
                    title: auto.title,
                    message: auto.message,
                    icon: auto.icon,
                    type: auto.type,
                    action_label: auto.action_label,
                    action_url: auto.action_url
                })

            if (insertError) console.error('Failed to insert prompt:', insertError)

            // B. Send Email
            if (auto.email_enabled) {
                // Get email from context or fetch it
                let email = additionalContext.email
                if (!email) {
                    const { data: user } = await supabase.auth.getUser()
                    email = user?.user?.email
                    if (!email) {
                        // As fallback, sometimes we might need to query auth table via admin - simpler to rely on context or profile if available
                        const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
                        email = profile?.email
                    }
                }

                if (email) {
                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientEmail: email,
                            subject: auto.email_subject,
                            htmlContent: auto.email_body
                        })
                    }).catch(err => console.error('Auto-email failed', err))
                }
            }
        }

    } catch (error) {
        console.error(`Automation Error (${triggerType}):`, error)
    }
}
