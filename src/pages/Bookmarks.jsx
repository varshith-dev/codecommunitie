import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Bookmark, ArrowLeft, Code2 } from 'lucide-react'
import Avatar from '../components/Avatar'
import { formatDate } from '../utils/timeAgo'
import toast from 'react-hot-toast'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function Bookmarks({ session }) {
    const navigate = useNavigate()
    const [bookmarks, setBookmarks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!session) {
            navigate('/login')
            return
        }
        fetchBookmarks()
    }, [session])

    const fetchBookmarks = async () => {
        try {
            setLoading(true)

            // Fetch bookmarks with post data
            const { data: bookmarksData, error: bookmarksError } = await supabase
                .from('bookmarks')
                .select('*, post_id')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (bookmarksError) throw bookmarksError

            if (!bookmarksData || bookmarksData.length === 0) {
                setBookmarks([])
                return
            }

            // Get post IDs
            const postIds = bookmarksData.map(b => b.post_id)

            // Fetch posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .in('id', postIds)

            // Fetch profiles for posts
            const userIds = [...new Set(postsData?.map(p => p.user_id) || [])]
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds)

            // Create profiles map
            const profilesMap = {}
            profilesData?.forEach(profile => {
                profilesMap[profile.id] = profile
            })

            // Combine data
            const bookmarksWithPosts = bookmarksData.map(bookmark => {
                const post = postsData?.find(p => p.id === bookmark.post_id)
                return {
                    ...bookmark,
                    post: post ? {
                        ...post,
                        profiles: profilesMap[post.user_id] || {
                            id: post.user_id,
                            username: 'Anonymous',
                            display_name: null,
                            profile_picture_url: null
                        }
                    } : null
                }
            }).filter(b => b.post !== null)

            setBookmarks(bookmarksWithPosts)
        } catch (error) {
            console.error('Error fetching bookmarks:', error)
            toast.error('Failed to load bookmarks')
        } finally {
            setLoading(false)
        }
    }

    const removeBookmark = async (bookmarkId) => {
        try {
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('id', bookmarkId)

            if (error) throw error

            setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
            toast.success('Removed from bookmarks')
        } catch (error) {
            console.error('Error removing bookmark:', error)
            toast.error('Failed to remove bookmark')
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <Bookmark className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Saved Posts</h1>
                        <p className="text-sm text-gray-500">{bookmarks.length} bookmarked posts</p>
                    </div>
                </div>
            </div>

            {/* Bookmarks List */}
            {bookmarks.length > 0 ? (
                <div className="space-y-4">
                    {bookmarks.map(bookmark => {
                        const post = bookmark.post
                        return (
                            <div
                                key={bookmark.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                            >
                                {/* Post Header */}
                                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={post.profiles.profile_picture_url}
                                            alt={post.profiles.display_name || post.profiles.username}
                                            size="md"
                                            userId={post.profiles.username ? `@${post.profiles.username}` : post.user_id}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {post.profiles.display_name || post.profiles.username || 'Anonymous'}
                                            </p>
                                            <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeBookmark(bookmark.id)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                {/* Post Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-3">{post.title}</h3>

                                    {post.type === 'meme' && post.content_url && (
                                        <>
                                            <div className="rounded-xl overflow-hidden bg-black/5 border border-gray-100 mb-2">
                                                {post.content_url.endsWith('.mp4') ? (
                                                    <video src={post.content_url} controls className="w-full max-h-[400px] object-contain" />
                                                ) : (
                                                    <img src={post.content_url} alt={post.title} className="w-full max-h-[400px] object-contain" />
                                                )}
                                            </div>
                                            {post.description && (
                                                <p className="text-gray-700 text-sm">{post.description}</p>
                                            )}
                                        </>
                                    )}

                                    {post.type === 'code' && post.code_snippet && (
                                        <div className="rounded-xl overflow-hidden border border-gray-800 shadow-md">
                                            <div className="bg-[#1e1e1e] px-4 py-2 flex justify-between items-center border-b border-gray-700">
                                                <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                                                    <Code2 size={12} />
                                                    {post.code_language || 'PLAINTEXT'}
                                                </span>
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
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Bookmark size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2 font-medium">No bookmarks yet</p>
                    <p className="text-sm text-gray-400">Save posts to read them later</p>
                </div>
            )}
        </div>
    )
}
