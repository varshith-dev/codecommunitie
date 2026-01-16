import { supabase } from '../supabaseClient'

// Simple in-memory lock to prevent race conditions from valid auth state changes firing rapidly
const processingLocks = new Set()

/**
 * Checks and triggers automations for a specific user and event type.
 * @param {string} userId - The ID of the user.
 * @param {string} triggerType - The type of trigger (e.g., 'new_user', 'login', 'create_post', 'incomplete_profile').
 * @param {object} additionalContext - Optional context data (e.g., email for sending).
 */
export const checkAndTriggerAutomations = async (userId, triggerType, additionalContext = {}) => {
    // 0. RACE CONDITION GUARD
    // Prevent multiple checks for the same trigger within a short window (e.g. page load)
    const lockKey = `${userId}-${triggerType}`
    if (processingLocks.has(lockKey)) {
        console.log(`Skipping locked automation: ${triggerType}`)
        return
    }

    // Set lock
    processingLocks.add(lockKey)
    // Auto-release lock after 5 seconds
    setTimeout(() => processingLocks.delete(lockKey), 5000)

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
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username, bio, website, profile_picture_url, banner_image_url, display_name')
                .eq('id', userId)
                .single()

            if (profileError) {
                console.error("Error fetching profile for automation:", profileError)
            }

            if (profile) {
                // RELAXED CHECK: If they have a username and at least ONE other field (bio, name, or pic), stop annoying them.
                // We don't want to spam users who just don't want a banner image.
                const hasIdentity = !!profile.username;
                const hasContent = profile.bio || profile.display_name || profile.profile_picture_url || profile.avatar_url;

                const isComplete = hasIdentity && hasContent;

                if (isComplete) {
                    console.log('Profile is sufficiently complete. Auto-dismissing prompts.')

                    // AUTO-DISMISS: If profile is complete, remove the prompt!
                    await supabase
                        .from('user_prompts')
                        .update({ is_dismissed: true })
                        .eq('user_id', userId)
                        .ilike('title', '%Complete Your Profile%')

                    return
                } else {
                    console.log('Profile is STILL incomplete. Missing:', {
                        username: !!profile.username,
                        bio: !!profile.bio,
                        pic: !!profile.profile_picture_url,
                        name: !!profile.display_name
                    })
                }
            }
        }

        // 3. Execute Automations
        for (const auto of automations) {
            // SPAM PREVENTION: Strict check for existing active prompts
            // If the user already has this prompt and hasn't dismissed it, DO NOT send another.
            const { data: existing } = await supabase
                .from('user_prompts')
                .select('id, created_at, is_dismissed')
                .eq('user_id', userId)
                .eq('title', auto.title)
                .eq('is_dismissed', false) // Only check active ones
                .limit(1)

            if (existing && existing.length > 0) {
                console.log(`Skipping duplicate active prompt: ${auto.title}`)
                continue
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
