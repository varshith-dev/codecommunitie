import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search as SearchIcon, User, Code2, FileText, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { timeAgo } from '../utils/timeAgo'

export default function Search() {
    const [query, setQuery] = useState('')
    const [activeTab, setActiveTab] = useState('users') // 'users', 'posts', 'code'
    const [searching, setSearching] = useState(false)
    const [results, setResults] = useState({
        users: [],
        posts: [],
        code: []
    })

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
                .select('id, username, display_name, profile_picture_url, bio')
                .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
                .limit(10)

            // Search Posts (all types)
            const { data: postsData } = await supabase
                .from('posts')
                .select('id, title, type, content_url, code_language, created_at, user_id, description')
                .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(10)

            // Fetch profiles for posts
            if (postsData && postsData.length > 0) {
                const userIds = [...new Set(postsData.map(post => post.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, profile_picture_url')
                    .in('id', userIds)

                const profilesMap = {}
                profilesData?.forEach(profile => {
                    profilesMap[profile.id] = profile
                })

                postsData.forEach(post => {
                    post.profile = profilesMap[post.user_id] || {
                        username: 'Anonymous',
                        display_name: null,
                        profile_picture_url: null
                    }
                })
            }

            // Search Code Posts by language
            const { data: codeData } = await supabase
                .from('posts')
                .select('id, title, type, code_snippet, code_language, created_at, user_id')
                .eq('type', 'code')
                .or(`code_language.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,code_snippet.ilike.%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(10)

            // Fetch profiles for code posts
            if (codeData && codeData.length > 0) {
                const userIds = [...new Set(codeData.map(post => post.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, profile_picture_url')
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
                posts: postsData || [],
                code: codeData || []
            })
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const tabs = [
        { id: 'users', label: 'Users', icon: User, count: results.users.length },
        { id: 'posts', label: 'Posts', icon: FileText, count: results.posts.length },
        { id: 'code', label: 'Code', icon: Code2, count: results.code.length }
    ]

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
                            onChange={(e) => setQuery(e.target.value)}
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
                    {query.trim().length < 2 ? (
                        <div className="text-center py-12 text-gray-400">
                            <SearchIcon size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Start typing to search...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <>
                                    {results.users.length > 0 ? (
                                        results.users.map(user => (
                                            <Link
                                                key={user.id}
                                                to={`/user/@${user.username}`}
                                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                                            >
                                                <Avatar
                                                    src={user.profile_picture_url}
                                                    alt={user.display_name || user.username}
                                                    size="lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {user.display_name || user.username}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                                    {user.bio && (
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <User size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>No users found</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Posts Tab */}
                            {activeTab === 'posts' && (
                                <>
                                    {results.posts.length > 0 ? (
                                        results.posts.map(post => (
                                            <div
                                                key={post.id}
                                                className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <Avatar
                                                        src={post.profile?.profile_picture_url}
                                                        alt={post.profile?.display_name || post.profile?.username}
                                                        size="sm"
                                                        userId={post.user_id}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <Link
                                                            to={`/user/@${post.profile?.username}`}
                                                            className="font-semibold text-gray-900 hover:text-blue-600 text-sm"
                                                        >
                                                            {post.profile?.display_name || post.profile?.username}
                                                        </Link>
                                                        <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${post.type === 'code' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                                        }`}>
                                                        {post.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                                                {post.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                                                )}
                                                {post.type === 'code' && post.code_language && (
                                                    <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {post.code_language}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <FileText size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>No posts found</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Code Tab */}
                            {activeTab === 'code' && (
                                <>
                                    {results.code.length > 0 ? (
                                        results.code.map(post => (
                                            <div
                                                key={post.id}
                                                className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <Avatar
                                                        src={post.profile?.profile_picture_url}
                                                        alt={post.profile?.display_name || post.profile?.username}
                                                        size="sm"
                                                        userId={post.user_id}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <Link
                                                            to={`/user/@${post.profile?.username}`}
                                                            className="font-semibold text-gray-900 hover:text-blue-600 text-sm"
                                                        >
                                                            {post.profile?.display_name || post.profile?.username}
                                                        </Link>
                                                        <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
                                                    </div>
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-medium">
                                                        {post.code_language}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                                                <div className="bg-slate-900 rounded-lg p-3 overflow-hidden max-h-32 relative">
                                                    <pre className="text-xs text-slate-300 font-mono line-clamp-5">
                                                        {post.code_snippet}
                                                    </pre>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <Code2 size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>No code snippets found</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
