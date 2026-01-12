import { TrendingUp, Users, Hash, Pin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Avatar from './Avatar'
import UserBadges from './UserBadges'

export default function Sidebar({ session }) {
    const [trendingTags, setTrendingTags] = useState([])
    const [pinnedTags, setPinnedTags] = useState([])
    const [suggestedUsers, setSuggestedUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [session])

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([fetchTrending(), fetchSuggestions()])
        setLoading(false)
    }

    const fetchTrending = async () => {
        try {
            // Fetch all tags with pinned and featured status
            const { data: allTags } = await supabase
                .from('tags')
                .select('id, name, slug, is_pinned, is_featured, pin_order')
                .order('is_pinned', { ascending: false })
                .order('pin_order', { ascending: true })
                .limit(20)

            if (allTags) {
                // Separate pinned tags
                const pinned = allTags.filter(tag => tag.is_pinned)
                setPinnedTags(pinned)

                // Get post counts for trending (non-pinned) tags
                const { data: recentTags } = await supabase
                    .from('post_tags')
                    .select('tags (id, name, slug), posts!inner (status)')
                    .eq('posts.status', 'published')
                    .limit(50)

                if (recentTags) {
                    const tagCounts = {}
                    recentTags.forEach(item => {
                        const tag = item.tags
                        if (tag && !pinned.find(p => p.id === tag.id)) { // Exclude pinned from trending
                            if (!tagCounts[tag.name]) {
                                tagCounts[tag.name] = { ...tag, count: 0 }
                            }
                            tagCounts[tag.name].count++
                        }
                    })
                    setTrendingTags(Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 5))
                }
            }
        } catch (error) {
            console.error('Error fetching trending:', error)
        }
    }

    const fetchSuggestions = async () => {
        if (!session) return

        try {
            // Get IDs the user is already following
            const { data: following } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', session.user.id)

            const followingIds = following?.map(f => f.following_id) || []
            // Add current user to exclusion list
            followingIds.push(session.user.id)

            // Fetch users not in the exclusion list
            const { data } = await supabase
                .from('profiles')
                .select('id, username, display_name, profile_picture_url, is_verified')
                .not('id', 'in', `(${followingIds.join(',')})`)
                .order('created_at', { ascending: false })
                .limit(3)

            setSuggestedUsers(data || [])
        } catch (error) {
            console.error('Error fetching suggestions:', error)
        }
    }

    return (
        <aside className="hidden lg:block col-span-1">
            <div className="sticky top-24 space-y-6">
                {/* Pinned Tags */}
                {pinnedTags.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-purple-100 flex items-center gap-2">
                            <Pin size={18} className="text-purple-600" />
                            <h2 className="font-extrabold text-lg text-gray-900">Pinned Topics</h2>
                        </div>
                        <div className="divide-y divide-purple-50">
                            {pinnedTags.map((tag, index) => (
                                <Link
                                    key={tag.id}
                                    to={`/search?q=${tag.name}`}
                                    className="block group cursor-pointer hover:bg-purple-50/50 p-3 rounded-xl transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Pin size={14} className="text-purple-500 flex-shrink-0" />
                                        <span className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            #{tag.name}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trending Tags */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-exrabold text-lg text-gray-900">Trending Now</h2>
                        {/* Removed duplicate icon for cleaner look */}
                    </div>

                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-5 space-y-4 animate-pulse">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />
                                ))}
                            </div>
                        ) : trendingTags.length > 0 ? (
                            trendingTags.map((tag, index) => (
                                <Link
                                    key={tag.name}
                                    to={`/search?q=${tag.name}`}
                                    className="block group cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-400 w-4">{index + 1}</span>
                                            <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                #{tag.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pl-7 text-xs text-gray-500 font-medium">
                                        {tag.post_count} posts
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-6">No trending topics yet.</p>
                        )}
                    </div>
                </div>

                {/* Who to Follow */}
                {session && suggestedUsers.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="font-extrabold text-lg text-gray-900">Who to follow</h2>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {suggestedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                    <Link to={`/user/${user.id}`} className="flex items-center gap-3 group min-w-0">
                                        <Avatar src={user.profile_picture_url} alt={user.username} size="sm" />
                                        <div className="flex flex-col min-w-0 overflow-hidden">
                                            <span className="text-sm font-bold text-gray-900 truncate group-hover:underline flex items-center gap-1">
                                                {user.display_name || user.username}
                                                <UserBadges user={user} />
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">@{user.username}</span>
                                        </div>
                                    </Link>
                                    <button className="text-xs font-bold text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-full transition-all">
                                        Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Links */}
                <div className="px-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                    <a href="#" className="hover:underline">Terms of Service</a>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <a href="#" className="hover:underline">Cookie Policy</a>
                    <a href="#" className="hover:underline">Accessibility</a>
                    <a href="#" className="hover:underline">Ads info</a>
                    <span>© 2026 CodeKrafts</span>
                </div>
            </div>
        </aside>
    )
}
