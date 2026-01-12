import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Avatar from '../components/Avatar'
import { MessageCircle, Heart, Share2, ArrowLeft, Code2, Edit2, Trash2, Send, Calendar } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import VerifiedBadge from '../components/VerifiedBadge'
import RoleBadge from '../components/RoleBadge'
import CommentSection from '../components/CommentSection'
import BookmarkButton from '../components/BookmarkButton'
import { PostSkeleton } from '../components/SkeletonLoader'
import ShareModal from '../components/ShareModal'
import EditPostModal from '../components/EditPostModal'
import UserBadges from '../components/UserBadges'
import toast from 'react-hot-toast'
import VideoPlayer from '../components/VideoPlayer'
import { timeAgo, formatDate } from '../utils/timeAgo'

export default function PostDetails({ session }) {
    const { postId } = useParams()
    const navigate = useNavigate()
    const [post, setPost] = useState(null)
    const [relatedPosts, setRelatedPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [likeCount, setLikeCount] = useState(0)
    const [isLiked, setIsLiked] = useState(false)
    const [commentCount, setCommentCount] = useState(0)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchPostAndRelated()
    }, [postId, session])

    const fetchPostAndRelated = async () => {
        setLoading(true)
        // 1. Fetch Post (without join to avoid 400 error)
        const { data: postData, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single()

        if (error) {
            console.error('Error fetching post:', error)
            setLoading(false)
            return
        }

        // 2. Fetch Author Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', postData.user_id)
            .single()

        const postWithProfile = { ...postData, profiles: profileData }

        // 3. Fetch Tags
        const { data: tagsData } = await supabase
            .from('post_tags')
            .select('tags(id, name)')
            .eq('post_id', postId)

        const postWithTags = { ...postWithProfile, tags: tagsData?.map(t => t.tags) || [] }
        setPost(postWithTags)

        // 4. Fetch Interactions (Likes/Comments)
        const { count: lCount } = await supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', postId)
        setLikeCount(lCount || 0)

        const { count: cCount } = await supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', postId)
        setCommentCount(cCount || 0)

        if (session) {
            const { data: likeData } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', session.user.id).single()
            setIsLiked(!!likeData)
        }

        // 5. Fetch Related Posts
        if (postWithTags.tags.length > 0) {
            const tagIds = postWithTags.tags.map(t => t.id)
            // Fetch related posts first, then their profiles
            const { data: relatedData } = await supabase
                .from('post_tags')
                .select('post_id, posts(*)')
                .in('tag_id', tagIds)
                .neq('post_id', postId)
                .limit(10)

            if (relatedData) {
                const posts = relatedData.map(r => r.posts)
                const uniquePosts = [...new Map(posts.map(item => [item['id'], item])).values()].slice(0, 3)

                // Fetch profiles for related posts
                const userIds = [...new Set(uniquePosts.map(p => p.user_id))]
                if (userIds.length > 0) {
                    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
                    const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p]) || [])

                    const finalRelated = uniquePosts.map(p => ({
                        ...p,
                        profiles: profileMap[p.user_id]
                    }))
                    setRelatedPosts(finalRelated)
                } else {
                    setRelatedPosts(uniquePosts)
                }
            }
        }
        setLoading(false)
    }

    const handleLike = async () => {
        if (!session) {
            toast.error('Please login to like')
            return
        }
        const userId = session.user.id
        if (isLiked) {
            await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
            setLikeCount(prev => prev - 1)
            setIsLiked(false)
        } else {
            await supabase.from('likes').insert([{ post_id: postId, user_id: userId }])
            setLikeCount(prev => prev + 1)
            setIsLiked(true)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return

        try {
            const { error } = await supabase.from('posts').delete().eq('id', postId)
            if (error) throw error

            toast.success('Post deleted successfully')
            navigate('/')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete post')
        }
    }

    const handlePublish = async () => {
        try {
            const { error } = await supabase
                .from('posts')
                .update({ status: 'published', scheduled_at: null, created_at: new Date() })
                .eq('id', postId)

            if (error) throw error

            setPost(prev => ({ ...prev, status: 'published', scheduled_at: null }))
            toast.success('Post published successfully!')
        } catch (error) {
            console.error('Publish error:', error)
            toast.error('Failed to publish post')
        }
    }

    const onUpdatePost = (updatedPost) => {
        setPost(prev => ({ ...prev, ...updatedPost }))
        setShowEditModal(false)
    }

    const isAuthor = session?.user?.id === post?.user_id

    if (loading) return <div className="max-w-3xl mx-auto py-8 px-4"><PostSkeleton /></div>
    if (!post) return <div className="text-center py-20">Post not found</div>

    return (
        <div className="max-w-4xl mx-auto pb-20 pt-6 px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 hover:border-blue-200 hover:bg-white mb-6 transition-all duration-200 group font-medium shadow-sm">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Feed</span>
            </Link>

            {/* Author Actions Bar for Drafts/Scheduled */}
            {isAuthor && post.status !== 'published' && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3 text-blue-800">
                        {post.status === 'draft' ? <Edit2 size={20} /> : <Calendar size={20} />}
                        <div>
                            <p className="font-bold text-sm">
                                This is a {post.status?.toUpperCase() || 'DRAFT'} post
                            </p>
                            {post.scheduled_at && <p className="text-xs">Scheduled for: {formatDate(post.scheduled_at)}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 bg-white text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handlePublish}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Send size={14} /> Publish Now
                        </button>
                    </div>
                </div>
            )}

            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-fade-in relative group/article">

                {/* Author Controls (Delete/Edit) */}
                {isAuthor && (
                    <div className="absolute top-6 right-6 z-10 flex items-center gap-2 opacity-0 group-hover/article:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Post"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Post"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-4">
                        <Link to={`/user/@${post.profiles?.username || post.user_id}`}>
                            <Avatar src={post.profiles?.profile_picture_url} alt={post.profiles?.username} size="md" />
                        </Link>
                        <div>
                            <Link to={`/user/@${post.profiles?.username || post.user_id}`} className="font-bold text-gray-900 hover:text-blue-600 text-lg flex items-center gap-1">
                                {post.profiles?.display_name || post.profiles?.username}
                                <UserBadges user={post.profiles} />
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>@{post.profiles?.username}</span>
                                <span>•</span>
                                <span>{timeAgo(post.created_at)}</span>
                                {post.status !== 'published' && (
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                        {post.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Type Badge moved slightly to avoid conflict with author controls */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mr-12 md:mr-0 ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                        {post.type}
                    </span>
                </div>

                {/* Content */}
                <div className="p-6">
                    {post.tags && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map(tag => (
                                <span key={tag.id} className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {post.title && <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>}

                    {/* Media/Code */}
                    {post.type === 'meme' && post.content_url && (
                        <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4">
                            {(post.content_url.match(/\.(mp4|webm|ogg|mov|mkv|avi|qt)$/i) || post.content_url.includes('video')) ? (
                                <VideoPlayer
                                    src={post.content_url}
                                    title={post.title}
                                />
                            ) : (
                                <img src={post.content_url} alt={post.title} className="w-full max-h-[700px] object-contain" />
                            )}
                        </div>
                    )}

                    {post.type === 'code' && post.code_snippet && (
                        <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg mb-4">
                            <div className="bg-[#1e1e1e] px-4 py-2 flex justify-between items-center border-b border-gray-700">
                                <span className="text-xs font-mono text-blue-400 flex items-center gap-1">
                                    <Code2 size={14} /> {post.code_language || 'PLAINTEXT'}
                                </span>
                            </div>
                            <SyntaxHighlighter
                                language={(post.code_language || 'javascript').toLowerCase()}
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, padding: '1.5rem', fontSize: '0.95rem' }}
                                showLineNumbers={true}
                                wrapLongLines={true}
                            >
                                {post.code_snippet}
                            </SyntaxHighlighter>
                        </div>
                    )}

                    {post.description && <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">{post.description}</p>}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50/50 flex items-center gap-4 border-t border-gray-100">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${isLiked ? 'text-pink-600 bg-pink-100' : 'text-gray-600 hover:bg-gray-100 hover:text-pink-600'}`}
                    >
                        <Heart size={22} className={isLiked ? 'fill-current' : ''} />
                        <span>{likeCount} Likes</span>
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
                        <MessageCircle size={22} />
                        <span>{commentCount} Comments</span>
                    </div>

                    <div className="flex-grow" />

                    <BookmarkButton postId={post.id} session={session} size={22} />

                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                    >
                        <Share2 size={22} />
                    </button>
                </div>

                {/* Comments */}
                <div className="bg-gray-50 p-6 border-t border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Comments</h3>
                    <CommentSection postId={post.id} session={session} onCommentAdded={() => setCommentCount(p => p + 1)} />
                </div>
            </article>

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                post={post}
            />

            {showEditModal && (
                <EditPostModal
                    post={post}
                    onClose={() => setShowEditModal(false)}
                    onPostUpdated={onUpdatePost}
                />
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-8 w-1 bg-blue-500 rounded-full" />
                        <h3 className="text-xl font-bold text-gray-900">Related Posts</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map(p => (
                            <Link key={p.id} to={`/post/${p.id}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                <div className="aspect-video bg-gray-100 overflow-hidden relative">
                                    {p.type === 'meme' ? (
                                        p.content_url?.includes('video') ? <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white"><Code2 /></div> :
                                            <img src={p.content_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-900 p-4 flex items-center justify-center">
                                            <Code2 className="text-blue-400 group-hover:scale-110 transition-transform" size={40} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-gray-900 truncate mb-1">{p.title || 'Untitled Post'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Avatar src={p.profiles?.profile_picture_url} size="xs" />
                                        <span className="truncate">{p.profiles?.username}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
