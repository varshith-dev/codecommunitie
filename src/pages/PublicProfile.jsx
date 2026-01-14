import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, Link as LinkIcon, Users, Edit2, Trash2, Clock, Lock, Code2 } from 'lucide-react'
import Avatar from '../components/Avatar'
import { formatDate } from '../utils/timeAgo'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import toast from 'react-hot-toast'
import EditPostModal from '../components/EditPostModal'
import UserListModal from '../components/UserListModal'
import UserBadges from '../components/UserBadges'

export default function PublicProfile({ session }) {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [editingPost, setEditingPost] = useState(null)
    const [showFollowersModal, setShowFollowersModal] = useState(false)
    const [showFollowingModal, setShowFollowingModal] = useState(false)

    useEffect(() => {
        fetchProfile()
        if (session) {
            checkFollowStatus()
        }
    }, [userId, session])

    const fetchProfile = async () => {
        try {
            setLoading(true)

            let profileData = null

            // Check if userId is a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            const isUUID = uuidRegex.test(userId)

            if (isUUID) {
                // UUID-based lookup
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (profileError) {
                    console.error('Error fetching profile by ID:', profileError)
                    setLoading(false)
                    return
                }
                profileData = data
            } else {
                // Username-based lookup (with or without @ prefix)
                const username = userId.startsWith('@') ? userId.substring(1) : userId
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .single()

                if (profileError) {
                    console.error('Error fetching profile by username:', profileError)
                    setLoading(false)
                    return
                }
                profileData = data
            }

            setProfile(profileData)

            setProfile(profileData)

            // Determine if viewing own profile
            const isOwn = session?.user?.id === profileData.id

            // Fetch user's posts 
            let query = supabase
                .from('posts')
                .select('*')
                .eq('user_id', profileData.id)
                .order('created_at', { ascending: false })

            // If not own profile, show only published
            if (!isOwn) {
                query = query.eq('status', 'published').eq('visibility', 'public')
            }

            const { data: postsData } = await query

            setPosts(postsData || [])
        } catch (error) {
            console.error('Error loading profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const checkFollowStatus = async () => {
        if (!session || !profile) return

        try {
            const { data } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', session.user.id)
                .eq('following_id', profile.id)
                .single()

            setIsFollowing(!!data)
        } catch (error) {
            // Not following
            setIsFollowing(false)
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

    const handlePostUpdate = (updatedPost) => {
        setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
        setEditingPost(null)
    }

    const handleFollow = async () => {
        if (!session) {
            toast.error('Please login to follow users')
            return
        }

        if (!profile) return

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', session.user.id)
                    .eq('following_id', profile.id)

                if (error) throw error

                setIsFollowing(false)
                setProfile(prev => ({
                    ...prev,
                    follower_count: Math.max(0, (prev?.follower_count || 0) - 1)
                }))

                toast.success('Unfollowed successfully')
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: session.user.id,
                        following_id: profile.id
                    })

                if (error) throw error

                setIsFollowing(true)
                setProfile(prev => ({
                    ...prev,
                    follower_count: (prev?.follower_count || 0) + 1
                }))

                toast.success('Followed successfully')
            }
        } catch (error) {
            console.error('Follow error:', error)
            toast.error(error.message || 'Failed to update follow status')
        }
    }

    useEffect(() => {
        if (profile && session) {
            checkFollowStatus()
        }
    }, [profile, session])

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <ProfileSkeleton />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Profile not found</h2>
                    <p className="text-gray-500 mt-2">This user doesn't exist or hasn't set up their profile yet.</p>
                </div>
            </div>
        )
    }

    const isOwnProfile = session?.user?.id === profile.id

    return (
        <>
            {/* Offline Indicator */}
            <OfflineIndicator />

            <div className="max-w-4xl mx-auto">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 animate-slide-up">
                    {/* Banner */}
                    <div className="h-32 md:h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                        {profile.banner_image_url && (
                            <img
                                src={profile.banner_image_url}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    <div className="px-4 md:px-8 pb-8">
                        {/* Avatar and Follow Button */}
                        <div className="relative flex justify-between items-end -mt-12 md:-mt-16 mb-6">
                            <Avatar
                                src={profile.profile_picture_url}
                                alt={profile.display_name || profile.username || 'User'}
                                size="2xl"
                            />

                            {!isOwnProfile && session && (
                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${isFollowing
                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.display_name || profile.username || 'User'}
                                <UserBadges user={profile} />
                            </h1>
                            <p className="text-gray-500">@{profile.username}</p>

                            {profile.bio && (
                                <p className="mt-4 text-gray-700">{profile.bio}</p>
                            )}

                            <div className="flex flex-wrap gap-4 mt-4 text-sm">
                                <button onClick={() => setShowFollowersModal(true)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    <span className="font-semibold text-gray-900">{profile.follower_count || 0}</span>
                                    <span className="text-gray-500">Followers</span>
                                </button>
                                <button onClick={() => setShowFollowingModal(true)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    <span className="font-semibold text-gray-900">{profile.following_count || 0}</span>
                                    <span className="text-gray-500">Following</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{posts.length}</span>
                                    <span className="text-gray-500">Posts</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                        <LinkIcon size={16} /> <span>Website</span>
                                    </a>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} /> <span>Joined {formatDate(profile.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User's Posts */}
                <h2 className="text-xl font-bold text-gray-900 mb-4 px-2">
                    Posts ({posts.length})
                </h2>

                {editingPost && (
                    <EditPostModal
                        post={editingPost}
                        onClose={() => setEditingPost(null)}
                        onUpdate={handlePostUpdate}
                    />
                )}

                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {posts.map(post => (
                            <Link to={`/post/${post.id}`} key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover-lift transition-all group relative block">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                            {post.type.toUpperCase()}
                                        </span>
                                        {post.status === 'draft' && (
                                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white shadow-sm rounded-lg p-1 border border-gray-100 z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault() // Prevent navigation
                                                    setEditingPost(post)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault() // Prevent navigation
                                                    handleDelete(post.id)
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <span className="text-xs text-gray-400 block mb-2">{formatDate(post.created_at)}
                                    {post.edited_at && <span className="italic ml-1">(edited)</span>}
                                </span>

                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>

                                {post.type === 'code' ? (
                                    <div className="bg-slate-900 rounded-lg p-3 overflow-hidden h-24 relative">
                                        <pre className="text-xs text-slate-300 font-mono line-clamp-4">
                                            {post.code_snippet}
                                        </pre>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-32 bg-gray-100 rounded-lg overflow-hidden mb-2 relative group-hover:opacity-90 transition-opacity">
                                            {post.content_url && (
                                                (post.content_url.match(/\.(mp4|webm|ogg|mov|mkv|avi|qt)$/i) || post.content_url.includes('video')) ? (
                                                    <>
                                                        <video
                                                            src={`${post.content_url}#t=0.001`}
                                                            className="w-full h-full object-cover"
                                                            preload="metadata"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <div className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
                                                                <Code2 size={16} />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img src={post.content_url} alt={post.title} className="w-full h-full object-cover" />
                                                )
                                            )}
                                        </div>
                                        {post.description && (
                                            <p className="text-xs text-gray-600 line-clamp-2">{post.description}</p>
                                        )}
                                    </>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
                        <p className="text-gray-500">No posts yet</p>
                    </div>
                )}
                {showFollowersModal && (
                    <UserListModal
                        userId={profile?.id}
                        type="followers"
                        title="Followers"
                        onClose={() => setShowFollowersModal(false)}
                    />
                )}

                {showFollowingModal && (
                    <UserListModal
                        userId={profile?.id}
                        type="following"
                        title="Following"
                        onClose={() => setShowFollowingModal(false)}
                    />
                )}
            </div>
            )
}
