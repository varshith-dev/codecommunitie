import { supabase } from '../supabaseClient'

/**
 * Authentication Service
 * Handles all authentication operations including email/password, OTP, and password resets
 */

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {Object} metadata - Additional user metadata (username, display_name)
 * @returns {Promise<{user, session, error}>}
 */
export async function signUpWithEmail(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/verify-email`
            }
        })

        if (error) throw error

        if (data.user) {
            // Handle Referral
            if (metadata.referral_code) {
                try {
                    // Use RPC to register referral (bypasses RLS for new/anon users)
                    const { data: result, error: rpcError } = await supabase.rpc('register_referral', {
                        referral_code_input: metadata.referral_code,
                        new_user_id: data.user.id
                    })

                    if (rpcError) {
                        console.error('Referral RPC error:', rpcError)
                    } else if (!result?.success) {
                        console.warn('Referral failed:', result?.error)
                    }
                } catch (err) {
                    console.error('Referral processing error:', err)
                }
            }
        }

        return { user: data.user, session: data.session, error: null }
    } catch (error) {
        console.error('Signup error:', error)
        return { user: null, session: null, error }
    }
}

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user, session, error}>}
 */
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error
        return { user: data.user, session: data.session, error: null }
    } catch (error) {
        console.error('Login error:', error)
        return { user: null, session: null, error }
    }
}

/**
 * Send OTP to user's email
 * @param {string} email - User's email
 * @returns {Promise<{success, error}>}
 */
export async function sendOTP(email) {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        })

        if (error) throw error
        return { success: true, error: null }
    } catch (error) {
        console.error('Send OTP error:', error)
        return { success: false, error }
    }
}

/**
 * Verify OTP code
 * @param {string} email - User's email
 * @param {string} token - OTP code
 * @returns {Promise<{user, session, error}>}
 */
export async function verifyOTP(email, token) {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })

        if (error) throw error
        return { user: data.user, session: data.session, error: null }
    } catch (error) {
        console.error('Verify OTP error:', error)
        return { user: null, session: null, error }
    }
}

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<{success, error}>}
 */
export async function sendPasswordReset(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })

        if (error) throw error
        return { success: true, error: null }
    } catch (error) {
        console.error('Password reset error:', error)
        return { success: false, error }
    }
}

/**
 * Update user's password
 * @param {string} newPassword - New password
 * @returns {Promise<{success, error}>}
 */
export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) throw error
        return { success: true, error: null }
    } catch (error) {
        console.error('Update password error:', error)
        return { success: false, error }
    }
}

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
    } catch (error) {
        console.error('Sign out error:', error)
        return { error }
    }
}

/**
 * Resend email verification
 * @returns {Promise<{success, error}>}
 */
export async function resendVerificationEmail(email = null) {
    try {
        let userEmail = email

        if (!userEmail) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No email provided and no user logged in')
            userEmail = user.email
        }

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: userEmail
        })

        if (error) throw error
        return { success: true, error: null }
    } catch (error) {
        console.error('Resend verification error:', error)
        return { success: false, error }
    }
}

/**
 * Get current user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return { user, error: null }
    } catch (error) {
        console.error('Get user error:', error)
        return { user: null, error }
    }
}
