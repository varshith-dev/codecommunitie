import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search as SearchIcon, User, Code2, FileText, Loader2, LayoutGrid } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import UserBadges from '../components/UserBadges'
import { timeAgo } from '../utils/timeAgo'
import { PostSkeleton, UserCardSkeleton } from '../components/SkeletonLoader'

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams()
    const initialQuery = searchParams.get('q') || ''

    const [query, setQuery] = useState(initialQuery)
    const [activeTab, setActiveTab] = useState('all') // 'all', 'users', 'posts', 'code'
    const [searching, setSearching] = useState(false)
    const [results, setResults] = useState({
        users: [],
        posts: [],
        code: []
    })

    // Sync URL param to state
    useEffect(() => {
        if (initialQuery !== query) {
            setQuery(initialQuery)
            if (initialQuery && initialQuery.startsWith('#')) {
                setActiveTab('posts')
            }
        }
    }, [initialQuery])

    // Update URL when query changes (optional, but good for shareability)
    const handleSearchChange = (val) => {
        setQuery(val)
        if (val) {
            setSearchParams({ q: val })
        } else {
            setSearchParams({})
        }
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch(query.trim())
            } else {
                setResults({ users: [], posts: [], code: [] })
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const performSearch = async (searchQuery) => {
        setSearching(true)
        try {
            // Search Users
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id, username, display_name, profile_picture_url, bio, is_verified')
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .limit(10)

            // Search Posts (by title/description)
            const { data: textPostsData } = await supabase
                .from('posts')
                .select('id, title, type, content_url, code_language, created_at, user_id, description')
                .eq('status', 'published')
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(20)

            // Search Posts (by tag)
            const { data: tagPostsData } = await supabase
                .from('posts')
                .select('id, title, type, content_url, code_language, created_at, user_id, description, post_tags!inner(tags!inner(name))')
                .eq('status', 'published')
                .ilike('post_tags.tags.name', `%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(20)

            // Merge and Deduplicate Posts
            const allPosts = [...(textPostsData || []), ...(tagPostsData || [])]
            const uniquePosts = [...new Map(allPosts.map(item => [item['id'], item])).values()]

            // Re-sort after merge
            uniquePosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            // Fetch profiles for posts
            if (uniquePosts.length > 0) {
                const userIds = [...new Set(uniquePosts.map(post => post.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, profile_picture_url, is_verified')
                    .in('id', userIds)

                const profilesMap = {}
                profilesData?.forEach(profile => {
                    profilesMap[profile.id] = profile
                })

                uniquePosts.forEach(post => {
                    post.profile = profilesMap[post.user_id] || {
                        username: 'Anonymous',
                        display_name: null,
                        profile_picture_url: null
                    }
                })
            }

            // Search Code Posts by language (Specific tab)
            // Note: Reuse uniquePosts filtering if type='code', but user might want explicit code search too.
            // Let's keep the existing logic for 'code' tab as it targets code specific fields.
            const { data: codeData } = await supabase
                .from('posts')
                .select('id, title, type, code_snippet, code_language, created_at, user_id')
                .eq('type', 'code')
                .eq('status', 'published')
                .or(`code_language.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,code_snippet.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(10)

            // Fetch profiles for code posts
            if (codeData && codeData.length > 0) {
                const userIds = [...new Set(codeData.map(post => post.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, profile_picture_url, is_verified')
                    .in('id', userIds)

                const profilesMap = {}
                profilesData?.forEach(profile => {
                    profilesMap[profile.id] = profile
                })

                codeData.forEach(post => {
                    post.profile = profilesMap[post.user_id] || {
                        username: 'Anonymous',
                        display_name: null,
                        profile_picture_url: null
                    }
                })
            }

            setResults({
                users: usersData || [],
                posts: uniquePosts || [],
                code: codeData || []
            })
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const tabs = [
        { id: 'all', label: 'All', icon: LayoutGrid, count: results.users.length + results.posts.length + results.code.length },
        { id: 'users', label: 'People', icon: User, count: results.users.length },
        { id: 'posts', label: 'Posts', icon: FileText, count: results.posts.length },
        { id: 'code', label: 'Code', icon: Code2, count: results.code.length }
    ]

    const hasResults = results.users.length > 0 || results.posts.length > 0 || results.code.length > 0

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search Header */}
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>

                    {/* Search Input */}
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search for users, posts, or code..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={query}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            autoFocus
                        />
                        {searching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={20} />
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {/* Show count only if > 0 and not 'all' tab (since all sum might be weird if duplicates exist, but here they are disparate) */}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="p-6">
                    {searching ? (
                        <div className="space-y-4 animate-fade-in">
                            {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                        </div>
                    ) : query.trim().length < 2 ? (
                        <div className="text-center py-12 text-gray-400">
                            <SearchIcon size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Start typing to search...</p>
                        </div>
                    ) : !hasResults ? (
                        <div className="text-center py-12 text-gray-400">
                            <SearchIcon size={48} className="mx-auto mb-3 opacity-50" />
                            <p>No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Users Tab/Section */}
                            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                                <div className="animate-fade-in">
                                    {activeTab === 'all' && <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><User size={18} /> People</h3>}
                                    <div className="grid grid-cols-1 gap-4">
                                        {results.users.map(user => (
                                            <Link
                                                key={user.id}
                                                to={`/user/@${user.username}`}
                                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 group"
                                            >
                                                <Avatar
                                                    src={user.profile_picture_url}
                                                    alt={user.display_name || user.username}
                                                    size="lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                                        {user.display_name || user.username}
                                                        <UserBadges user={user} />
                                                    </h3>
                                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                                    {user.bio && (
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Posts Tab/Section */}
                            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                                <div className="animate-fade-in">
                                    {activeTab === 'all' && <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText size={18} /> Posts</h3>}
                                    <div className="grid grid-cols-1 gap-4">
                                        {results.posts.map(post => (
                                            <Link
                                                key={post.id}
                                                to={`/post/${post.id}`}
                                                className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-white hover:bg-gray-50 group"
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                                        <Avatar
                                                            src={post.profile?.profile_picture_url}
                                                            alt={post.profile?.display_name || post.profile?.username}
                                                            size="sm"
                                                        />
                                                        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                                            {post.profile?.display_name || post.profile?.username}
                                                            <UserBadges user={post.profile} />
                                                        </span>
                                                        <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                                        }`}>
                                                        {post.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                                                {post.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                                                )}
                                                {post.type === 'code' && post.code_language && (
                                                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {post.code_language}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Code Tab/Section */}
                            {(activeTab === 'all' || activeTab === 'code') && results.code.length > 0 && (
                                <div className="animate-fade-in">
                                    {activeTab === 'all' && <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Code2 size={18} /> Code Snippets</h3>}
                                    <div className="grid grid-cols-1 gap-4">
                                        {results.code.map(post => (
                                            <Link
                                                key={post.id}
                                                to={`/post/${post.id}`}
                                                className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors bg-white hover:bg-gray-50 group"
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                                        <Avatar
                                                            src={post.profile?.profile_picture_url}
                                                            alt={post.profile?.display_name || post.profile?.username}
                                                            size="sm"
                                                        />
                                                        <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                                            {post.profile?.display_name || post.profile?.username}
                                                            <UserBadges user={post.profile} />
                                                        </span>
                                                        <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                                                    </div>
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-medium">
                                                        {post.code_language}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                                                <div className="bg-slate-900 rounded-lg p-3 overflow-hidden max-h-32 relative">
                                                    <pre className="text-xs text-slate-300 font-mono line-clamp-5">
                                                        {post.code_snippet}
                                                    </pre>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
