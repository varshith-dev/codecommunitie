import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'

export default function BookmarkButton({ postId, size = 20, showCount = false }) {
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [count, setCount] = useState(0)

    useEffect(() => {
        checkBookmarkStatus()
        if (showCount) fetchBookmarkCount()
    }, [postId])

    const checkBookmarkStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('bookmarks')
                .select('id')
                .eq('user_id', user.id)
                .eq('post_id', postId)
                .single()

            if (!error && data) {
                setIsBookmarked(true)
            }
        } catch (error) {
            // Not bookmarked
        }
    }

    const fetchBookmarkCount = async () => {
        const { count: bookmarkCount } = await supabase
            .from('bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)

        setCount(bookmarkCount || 0)
    }

    const toggleBookmark = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error('Please login to bookmark posts')
            return
        }

        setLoading(true)

        try {
            if (isBookmarked) {
                // Remove bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('post_id', postId)

                if (error) throw error

                setIsBookmarked(false)
                if (showCount) setCount(c => Math.max(0, c - 1))
                toast.success('Removed from bookmarks')
            } else {
                // Add bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .insert({
                        user_id: user.id,
                        post_id: postId
                    })

                if (error) throw error

                setIsBookmarked(true)
                if (showCount) setCount(c => c + 1)
                toast.success('Added to bookmarks')
            }
        } catch (error) {
            console.error('Bookmark error:', error)
            toast.error('Failed to update bookmark')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={toggleBookmark}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${isBookmarked
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
        >
            {isBookmarked ? (
                <BookmarkCheck size={size} className="fill-current" />
            ) : (
                <Bookmark size={size} />
            )}
            {showCount && count > 0 && (
                <span className="text-sm font-medium">{count}</span>
            )}
        </button>
    )
}
