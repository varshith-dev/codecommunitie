import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from './Avatar'
import { CommentSkeleton } from './SkeletonLoader'
import { timeAgo } from '../utils/timeAgo'

export default function CommentSection({ postId, session, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    setFetching(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            profile_picture_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (!error) setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('comments')
        .insert([{
          content: newComment,
          post_id: postId,
          user_id: session.user.id
        }])

      if (error) throw error

      setNewComment('')
      await fetchComments()
      if (onCommentAdded) onCommentAdded()
      toast.success('Comment added!')
    } catch (error) {
      toast.error('Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 border-t border-gray-100 p-4 animate-slide-down">

      {/* List of Comments */}
      <div className="space-y-4 mb-4 max-h-80 overflow-y-auto custom-scrollbar">
        {fetching ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-fade-in">
              <Avatar
                src={comment.profiles?.profile_picture_url}
                alt={comment.profiles?.display_name || comment.profiles?.username || 'User'}
                size="sm"
                userId={comment.user_id}
              />
              <div className="flex-1 min-w-0">
                <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-gray-400 italic py-4">
            No comments yet. Start the conversation!
          </p>
        )}
      </div>

      {/* Input Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 text-sm rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="text-center text-sm text-gray-500">
          <a href="/auth" className="text-blue-600 hover:underline">Log in</a> to comment.
        </p>
      )}
    </div>
  )
}