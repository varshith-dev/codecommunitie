import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Heart, MessageCircle, Trash2, Code2, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import CommentSection from '../components/CommentSection'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import { PostSkeleton } from '../components/SkeletonLoader'
import { timeAgo } from '../utils/timeAgo'
import { usePostAnalytics } from '../hooks/usePostAnalytics'
import { Link } from 'react-router-dom'

export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCommentId, setActiveCommentId] = useState(null)
  const [likeCounts, setLikeCounts] = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [userLikes, setUserLikes] = useState(new Set())
  const [connectionError, setConnectionError] = useState(false)

  useEffect(() => {
    fetchPosts()
    if (session) {
      fetchUserLikes()
    }
  }, [session])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setConnectionError(false)

      // Fetch posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        if (postsError.message?.includes('relation') || postsError.message?.includes('does not exist')) {
          setConnectionError(true)
        }
        throw postsError
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))]

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, profile_picture_url')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Continue without profiles if they fail to load
      }

      // Create a map of profiles by user_id
      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Combine posts with profiles
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profiles: profilesMap[post.user_id] || {
          id: post.user_id,
          username: 'Anonymous',
          display_name: null,
          profile_picture_url: null
        }
      }))

      setPosts(postsWithProfiles)

      // Fetch counts for all posts
      if (postsWithProfiles.length > 0) {
        await fetchAllCounts(postsWithProfiles.map(p => p.id))
      }
    } catch (error) {
      if (!connectionError) {
        toast.error('Error loading feed')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllCounts = async (postIds) => {
    try {
      // Fetch like counts
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      const likes = {}
      likesData?.forEach(like => {
        likes[like.post_id] = (likes[like.post_id] || 0) + 1
      })
      setLikeCounts(likes)

      // Fetch comment counts
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)

      const comments = {}
      commentsData?.forEach(comment => {
        comments[comment.post_id] = (comments[comment.post_id] || 0) + 1
      })
      setCommentCounts(comments)
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const fetchUserLikes = async () => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', session.user.id)

      setUserLikes(new Set(data?.map(like => like.post_id) || []))
    } catch (error) {
      console.error('Error fetching user likes:', error)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error

      setPosts(posts.filter(post => post.id !== postId))
      toast.success('Post deleted successfully')
    } catch (error) {
      toast.error('Error deleting post')
    }
  }

  const toggleLike = async (postId) => {
    if (!session) {
      toast.error('Please login to like posts')
      return
    }

    const isLiked = userLikes.has(postId)
    const userId = session.user.id

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId)

        setUserLikes(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }))
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: userId, post_id: postId }])

        setUserLikes(prev => new Set([...prev, postId]))
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    }
  }

  // Track view for analytics
  const PostWithAnalytics = ({ post, children }) => {
    const { trackView } = usePostAnalytics(post.id)

    useEffect(() => {
      trackView(session?.user?.id)
    }, [])

    return children
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
      </div>
    )
  }

  if (connectionError) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center animate-scale-in">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Database Not Set Up</h2>
          <p className="text-red-700 mb-6">
            It looks like your Supabase database hasn't been configured yet. Please follow these steps:
          </p>
          <div className="bg-white rounded-xl p-6 text-left space-y-4 border border-red-200">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">1. Create Supabase Project</h3>
              <p className="text-sm text-gray-600">Sign up at <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">2. Run Database Schema</h3>
              <p className="text-sm text-gray-600">Open SQL Editor in Supabase and run the contents of <code className="bg-gray-100 px-2 py-1 rounded">database_complete.sql</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">3. Create Storage Buckets</h3>
              <p className="text-sm text-gray-600">Create public buckets: <code className="bg-gray-100 px-1 rounded text-xs">profile-pictures</code>, <code className="bg-gray-100 px-1 rounded text-xs">banner-images</code>, <code className="bg-gray-100 px-1 rounded text-xs">meme-uploads</code></p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">4. Configure Environment</h3>
              <p className="text-sm text-gray-600">Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> and add your Supabase credentials</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">See README.md for detailed instructions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {posts.map((post) => (
        <PostWithAnalytics key={post.id} post={post}>
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover-lift animate-slide-up">

            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  src={post.profiles?.profile_picture_url}
                  alt={post.profiles?.display_name || post.profiles?.username || 'User'}
                  size="md"
                  userId={post.user_id}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/user/${post.user_id}`}
                    className="font-semibold text-gray-900 leading-tight hover:text-blue-600 transition-colors block truncate"
                  >
                    {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{timeAgo(post.created_at)}</span>
                    {post.type === 'code' && post.code_language && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{post.code_language}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Follow Button */}
                {post.user_id !== session?.user?.id && (
                  <FollowButton
                    targetUserId={post.user_id}
                    session={session}
                    size="sm"
                    variant="outline"
                  />
                )}

                {/* Delete Button (Only if you own the post) */}
                {session && session.user.id === post.user_id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Delete post"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Post Title */}
            {post.title && (
              <div className="px-4 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
              </div>
            )}

            {/* Post Content */}
            <div className="px-4 pb-2">
              {post.type === 'meme' && post.content_url && (
                <div className="rounded-xl overflow-hidden bg-black/5 border border-gray-100">
                  {post.content_url.endsWith('.mp4') || post.content_url.includes('video') ? (
                    <video src={post.content_url} controls className="w-full max-h-[600px] object-contain bg-black" />
                  ) : (
                    <img src={post.content_url} alt={post.title} className="w-full max-h-[600px] object-contain" />
                  )}
                </div>
              )}

              {post.type === 'code' && post.code_snippet && (
                <div className="rounded-xl overflow-hidden border border-gray-800 shadow-md">
                  <div className="bg-[#1e1e1e] px-4 py-2 flex justify-between items-center border-b border-gray-700">
                    <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                      <Code2 size={12} />
                      {post.code_language || 'PLAINTEXT'}
                    </span>
                    <span className="text-[10px] text-gray-500">Read-only</span>
                  </div>
                  <SyntaxHighlighter
                    language={(post.code_language || 'javascript').toLowerCase()}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.9rem' }}
                    showLineNumbers={true}
                    wrapLongLines={true}
                  >
                    {post.code_snippet}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>

            {/* Action Buttons (Likes/Comments) */}
            <div className="p-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex gap-6">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-2 transition-all group ${userLikes.has(post.id)
                    ? 'text-pink-500'
                    : 'text-gray-500 hover:text-pink-500'
                    }`}
                >
                  <Heart
                    size={20}
                    className={`group-hover:scale-110 transition-transform ${userLikes.has(post.id) ? 'fill-pink-500' : ''
                      }`}
                  />
                  <span className="text-sm font-medium">
                    {likeCounts[post.id] || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                  className={`flex items-center gap-2 transition-colors ${activeCommentId === post.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-500'
                    }`}
                >
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">
                    {commentCounts[post.id] || 0}
                  </span>
                </button>
              </div>

              {/* Admin insights button */}
              {session?.user && (
                <Link
                  to={`/admin?post=${post.id}`}
                  className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                  title="View insights"
                >
                  <BarChart3 size={18} />
                </Link>
              )}
            </div>

            {/* Comments Section */}
            {activeCommentId === post.id && (
              <CommentSection
                postId={post.id}
                session={session}
                onCommentAdded={() => {
                  setCommentCounts(prev => ({
                    ...prev,
                    [post.id]: (prev[post.id] || 0) + 1
                  }))
                }}
              />
            )}

          </article>
        </PostWithAnalytics>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 animate-fade-in">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code2 className="text-blue-500" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
          <p className="text-gray-500 mt-2">Be the first to share something amazing!</p>
          {session && (
            <Link
              to="/create"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Post
            </Link>
          )}
        </div>
      )}
    </div>
  )
}