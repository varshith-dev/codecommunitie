import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { MapPin, Link as LinkIcon, Calendar, Users } from 'lucide-react'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import { ProfileSkeleton } from '../components/SkeletonLoader'
import { formatDate } from '../utils/timeAgo'
import toast from 'react-hot-toast'

export default function PublicProfile({ session }) {
    const { userId } = useParams()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])

    useEffect(() => {
        if (userId) {
            fetchProfile()
        }
    }, [userId])

    const fetchProfile = async () => {
        try {
            setLoading(true)

            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) throw profileError
            setProfile(profileData)

            // Fetch user's posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            setPosts(postsData || [])
        } catch (error) {
            console.error('Error loading profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

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

    const isOwnProfile = session?.user?.id === userId

    return (
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
                            size="3xl"
                            className="border-4 border-white shadow-lg"
                        />

                        {!isOwnProfile && (
                            <FollowButton
                                targetUserId={userId}
                                session={session}
                                size="md"
                            />
                        )}
                    </div>

                    {/* Profile Info */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {profile.display_name || profile.username || 'Anonymous'}
                        </h1>
                        {profile.username && profile.display_name && (
                            <p className="text-gray-500 text-sm">@{profile.username}</p>
                        )}
                        <p className="text-gray-600 mt-2">{profile.bio || 'No bio yet.'}</p>

                        {/* Stats */}
                        <div className="flex gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                <span className="font-semibold text-gray-900">{profile.follower_count || 0}</span>
                                <span className="text-gray-500">Followers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{profile.following_count || 0}</span>
                                <span className="text-gray-500">Following</span>
                            </div>
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

            {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover-lift transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                    {post.type.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                            </div>

                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>

                            {post.type === 'code' ? (
                                <div className="bg-slate-900 rounded-lg p-3 overflow-hidden h-24 relative">
                                    <pre className="text-xs text-slate-300 font-mono line-clamp-4">
                                        {post.code_snippet}
                                    </pre>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                                </div>
                            ) : (
                                <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                                    {post.content_url && (
                                        post.content_url.endsWith('.mp4') ? (
                                            <video src={post.content_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={post.content_url} alt={post.title} className="w-full h-full object-cover" />
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
                    <p className="text-gray-500">No posts yet.</p>
                </div>
            )}
        </div>
    )
}
