import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Custom hook for post analytics
 * @param {string} postId - The post ID to track
 * @returns {object} - {analytics, trackView, updateEngagement}
 */
export function usePostAnalytics(postId) {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!postId) return
        fetchAnalytics()
    }, [postId])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('post_analytics')
                .select('*')
                .eq('post_id', postId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching analytics:', error)
            }

            setAnalytics(data || {
                view_count: 0,
                unique_viewers: 0,
                engagement_rate: 0
            })
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const trackView = async (userId = null) => {
        try {
            // Record view
            await supabase
                .from('post_views')
                .insert([{
                    post_id: postId,
                    user_id: userId
                }])

            // Get unique viewer count
            const { data: uniqueData } = await supabase
                .from('post_views')
                .select('user_id')
                .eq('post_id', postId)

            const uniqueViewers = new Set(uniqueData?.map(v => v.user_id).filter(Boolean)).size

            // Get total view count
            const { count } = await supabase
                .from('post_views')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId)

            // Update analytics
            await supabase
                .from('post_analytics')
                .update({
                    view_count: count || 0,
                    unique_viewers: uniqueViewers,
                    last_viewed_at: new Date().toISOString()
                })
                .eq('post_id', postId)

            // Refresh analytics
            await fetchAnalytics()
        } catch (error) {
            console.error('Error tracking view:', error)
        }
    }

    const updateEngagement = async () => {
        try {
            // Call the database function to update engagement rate
            await supabase.rpc('update_engagement_rate', { p_post_id: postId })
            await fetchAnalytics()
        } catch (error) {
            console.error('Error updating engagement:', error)
        }
    }

    return { analytics, loading, trackView, updateEngagement, refresh: fetchAnalytics }
}
