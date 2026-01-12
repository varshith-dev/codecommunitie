import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import {
    Settings as SettingsIcon,
    Activity,
    BarChart3,
    Heart,
    MessageCircle,
    Users,
    FileText,
    TrendingUp,
    Calendar,
    ArrowLeft
} from 'lucide-react'
import { formatDate } from '../utils/timeAgo'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'

export default function Settings({ session }) {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        followers: 0,
        following: 0
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        if (!session) {
            navigate('/login')
            return
        }
        fetchData()
    }, [session])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            setProfile(profileData)

            // Fetch stats
            const [postsResult, likesResult, commentsResult] = await Promise.all([
                supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', session.user.id),
                supabase.from('likes').select('*', { count: 'exact' }).eq('user_id', session.user.id),
                supabase.from('comments').select('*', { count: 'exact' }).eq('user_id', session.user.id)
            ])

            setStats({
                totalPosts: postsResult.count || 0,
                totalLikes: likesResult.count || 0,
                totalComments: commentsResult.count || 0,
                followers: profileData?.follower_count || 0,
                following: profileData?.following_count || 0
            })

            // Fetch recent posts for activity
            const { data: postsData } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            setRecentActivity(postsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'engagement', label: 'Engagement', icon: Heart }
    ]

    const statCards = [
        { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'blue' },
        { label: 'Likes Given', value: stats.totalLikes, icon: Heart, color: 'pink' },
        { label: 'Comments Made', value: stats.totalComments, icon: MessageCircle, color: 'green' },
        { label: 'Followers', value: stats.followers, icon: Users, color: 'purple' },
        { label: 'Following', value: stats.following, icon: TrendingUp, color: 'orange' }
    ]

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
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
                        <SettingsIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings & Activity</h1>
                        <p className="text-sm text-gray-500">View your stats and manage your account</p>
                    </div>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <Avatar
                        src={profile?.profile_picture_url}
                        alt={profile?.display_name || profile?.username}
                        size="xl"
                    />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                            {profile?.display_name || profile?.username || 'User'}
                        </h2>
                        <p className="text-gray-500">@{profile?.username}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            <Calendar size={14} className="inline mr-1" />
                            Joined {formatDate(profile?.created_at)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">Your Statistics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {statCards.map(stat => (
                                    <div
                                        key={stat.label}
                                        className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 border border-${stat.color}-200 rounded-xl p-6 hover:shadow-md transition-shadow`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <stat.icon className={`text-${stat.color}-600`} size={24} />
                                            <span className={`text-3xl font-bold text-${stat.color}-900`}>
                                                {stat.value}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-medium text-${stat.color}-700`}>{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-3">
                                    {recentActivity.map(post => (
                                        <div
                                            key={post.id}
                                            className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className={`p-2 rounded-lg ${post.type === 'code' ? 'bg-blue-100' : 'bg-pink-100'
                                                }`}>
                                                <FileText size={18} className={
                                                    post.type === 'code' ? 'text-blue-600' : 'text-pink-600'
                                                } />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{post.title}</p>
                                                <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                                }`}>
                                                {post.type.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-12">No activity yet</p>
                            )}
                        </div>
                    )}

                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Your Posts</h3>
                                <span className="text-2xl font-bold text-blue-600">{stats.totalPosts}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-600 font-medium">Code Posts</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {recentActivity.filter(p => p.type === 'code').length}
                                    </p>
                                </div>
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                    <p className="text-sm text-pink-600 font-medium">Meme Posts</p>
                                    <p className="text-2xl font-bold text-pink-900">
                                        {recentActivity.filter(p => p.type === 'meme').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Engagement Tab */}
                    {activeTab === 'engagement' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Engagement Stats</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-pink-50 border border-pink-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Heart className="text-pink-600" size={24} />
                                        <span className="font-medium text-gray-900">Total Likes Given</span>
                                    </div>
                                    <span className="text-2xl font-bold text-pink-600">{stats.totalLikes}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="text-green-600" size={24} />
                                        <span className="font-medium text-gray-900">Total Comments Made</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{stats.totalComments}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Users className="text-purple-600" size={24} />
                                        <span className="font-medium text-gray-900">Followers</span>
                                    </div>
                                    <span className="text-2xl font-bold text-purple-600">{stats.followers}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
