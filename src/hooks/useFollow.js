import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

/**
 * Custom hook for follow/unfollow functionality
 * @param {string} targetUserId - The user ID to follow/unfollow
 * @param {object} session - The current user session
 * @returns {object} - {isFollowing, loading, toggleFollow}
 */
export function useFollow(targetUserId, session) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!session || !targetUserId) return
        checkFollowStatus()
    }, [targetUserId, session])

    const checkFollowStatus = async () => {
        if (!session) return

        try {
            const { data, error } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', session.user.id)
                .eq('following_id', targetUserId)
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows returned (not following)
                console.error('Error checking follow status:', error)
            }

            setIsFollowing(!!data)
        } catch (error) {
            console.error('Error checking follow status:', error)
        }
    }

    const toggleFollow = async () => {
        if (!session) {
            toast.error('Please login to follow users')
            return
        }

        if (session.user.id === targetUserId) {
            toast.error('You cannot follow yourself')
            return
        }

        setLoading(true)

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', session.user.id)
                    .eq('following_id', targetUserId)

                if (error) throw error

                setIsFollowing(false)
                toast.success('Unfollowed')
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert([{
                        follower_id: session.user.id,
                        following_id: targetUserId
                    }])

                if (error) throw error

                setIsFollowing(true)
                toast.success('Following!')
            }
        } catch (error) {
            console.error('Error toggling follow:', error)
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return { isFollowing, loading, toggleFollow }
}
