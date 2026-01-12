import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart3, Users, FileText, TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { timeAgo } from '../utils/timeAgo'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminDashboard({ session }) {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({})
    const [topPosts, setTopPosts] = useState([])
    const [selectedPost, setSelectedPost] = useState(null)
    const [postInsights, setPostInsights] = useState(null)
    const [searchParams] = useSearchParams()

    useEffect(() => {
        fetchStats()
        fetchTopPosts()

        const postId = searchParams.get('post')
        if (postId) {
            fetchPostInsights(postId)
        }
    }, [searchParams])

    const fetchStats = async () => {
        try {
            // Get total users
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Get total posts
            const { count: postsCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })

            // Get total likes
            const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })

            // Get total comments
            const { count: commentsCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })

            setStats({
                users: usersCount || 0,
                posts: postsCount || 0,
                likes: likesCount || 0,
                comments: commentsCount || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const fetchTopPosts = async () => {
        try {
            setLoading(true)

            // Fetch posts with analytics
            const { data: posts } = await supabase
                .from('posts')
                .select(`
          *,
          profiles:user_id (username, display_name),
          post_analytics (view_count, engagement_rate)
        `)
                .order('created_at', { ascending: false })
                .limit(10)

            // Get like counts
            const postIds = posts?.map(p => p.id) || []
            const { data: likesData } = await supabase
                .from('likes')
                .select('post_id')
                .in('post_id', postIds)

            const likeCounts = {}
            likesData?.forEach(like => {
                likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
            })

            // Get comment counts
            const { data: commentsData } = await supabase
                .from('comments')
                .select('post_id')
                .in('post_id', postIds)

            const commentCounts = {}
            commentsData?.forEach(comment => {
                commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
            })

            // Combine data
            const postsWithCounts = posts?.map(post => ({
                ...post,
                like_count: likeCounts[post.id] || 0,
                comment_count: commentCounts[post.id] || 0
            }))

            setTopPosts(postsWithCounts || [])
        } catch (error) {
            console.error('Error fetching top posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPostInsights = async (postId) => {
        try {
            const { data: post } = await supabase
                .from('posts')
                .select(`
          *,
          profiles:user_id (username, display_name),
          post_analytics (*)
        `)
                .eq('id', postId)
                .single()

            if (!post) {
                toast.error('Post not found')
                return
            }

            // Get detailed counts
            const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId)

            const { count: commentsCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId)

            setSelectedPost(post)
            setPostInsights({
                ...post.post_analytics,
                likes: likesCount || 0,
                comments: commentsCount || 0
            })
        } catch (error) {
            console.error('Error fetching post insights:', error)
            toast.error('Failed to load insights')
        }
    }

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading dashboard..." />
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-500">Platform overview and analytics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Users className="text-blue-600" />}
                    title="Total Users"
                    value={stats.users}
                    bgColor="bg-blue-50"
                />
                <StatCard
                    icon={<FileText className="text-purple-600" />}
                    title="Total Posts"
                    value={stats.posts}
                    bgColor="bg-purple-50"
                />
                <StatCard
                    icon={<Heart className="text-pink-600" />}
                    title="Total Likes"
                    value={stats.likes}
                    bgColor="bg-pink-50"
                />
                <StatCard
                    icon={<MessageCircle className="text-green-600" />}
                    title="Total Comments"
                    value={stats.comments}
                    bgColor="bg-green-50"
                />
            </div>

            {/* Post Insights Modal */}
            {selectedPost && postInsights && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-scale-in">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Post Insights</h2>
                            <p className="text-gray-500 mt-1">{selectedPost.title}</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedPost(null)
                                setPostInsights(null)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <MetricCard label="Views" value={postInsights.view_count || 0} icon={<Eye size={20} />} />
                        <MetricCard label="Unique Viewers" value={postInsights.unique_viewers || 0} icon={<Users size={20} />} />
                        <MetricCard label="Likes" value={postInsights.likes} icon={<Heart size={20} />} />
                        <MetricCard label="Comments" value={postInsights.comments} icon={<MessageCircle size={20} />} />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-blue-600" size={20} />
                            <span className="font-semibold text-gray-900">Engagement Rate</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                            {postInsights.engagement_rate?.toFixed(2) || 0}%
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            (Likes + Comments) / Views × 100
                        </p>
                    </div>
                </div>
            )}

            {/* Top Posts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Post</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Author</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Views</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Likes</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Comments</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Engagement</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topPosts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${post.type === 'code' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {post.type}
                                            </span>
                                            <span className="font-medium text-gray-900 line-clamp-1">{post.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                        {post.post_analytics?.view_count || 0}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                        {post.like_count}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                        {post.comment_count}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-semibold text-blue-600">
                                            {post.post_analytics?.engagement_rate?.toFixed(1) || 0}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {timeAgo(post.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => fetchPostInsights(post.id)}
                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, title, value, bgColor }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover-lift">
            <div className={`${bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
    )
}

function MetricCard({ label, value, icon }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
    )
}
