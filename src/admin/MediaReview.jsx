
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Check, X, Eye, AlertTriangle, Trash2, ExternalLink, EyeOff, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function MediaReview() {
    const [media, setMedia] = useState([])
    const [loading, setLoading] = useState(true)
    const [reviewStatus, setReviewStatus] = useState({}) // Map<postId, 'safe' | 'restricted' | 'removed'>

    useEffect(() => {
        fetchMedia()
    }, [])

    const fetchMedia = async () => {
        setLoading(true)
        console.log('MediaReview: Fetching media...')
        try {
            // Step 1: Fetch Posts (No Joins)
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .not('content_url', 'is', null)
                .neq('content_url', '')
                .order('created_at', { ascending: false })
                .limit(50)

            if (postsError) {
                console.error('MediaReview: Fetch error:', postsError)
                throw postsError
            }

            if (!postsData || postsData.length === 0) {
                setMedia([])
                setLoading(false)
                return
            }

            // Step 2: Fetch Profiles for these posts
            const userIds = [...new Set(postsData.map(p => p.user_id))]

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, profile_picture_url')
                .in('id', userIds)

            if (profilesError) {
                console.error('MediaReview: Profile fetch error:', profilesError)
                // Don't crash, just show without profiles
            }

            // Map profiles to posts
            const profilesMap = {}
            profilesData?.forEach(p => {
                profilesMap[p.id] = p
            })

            const mediaWithProfiles = postsData.map(post => ({
                ...post,
                profiles: profilesMap[post.user_id] || { username: 'Unknown', profile_picture_url: null }
            }))

            // Step 3: Initialize review status
            // Initialize review status from DB
            const initialStatus = {}
            mediaWithProfiles.forEach(post => {
                if (post.review_status) {
                    initialStatus[post.id] = post.review_status
                }
            })
            setReviewStatus(initialStatus)
            setMedia(mediaWithProfiles)

        } catch (err) {
            console.error('MediaReview: Fetch failed:', err)
            toast.error('Failed to load media')
        } finally {
            setLoading(false)
        }
    }

    const markPost = async (id, status) => {
        setReviewStatus(prev => ({ ...prev, [id]: status }))

        if (status === 'removed') {
            if (!window.confirm('Confirm Deletion?')) {
                setReviewStatus(prev => {
                    const newSt = { ...prev }
                    delete newSt[id]
                    return newSt
                })
                return
            }

            const { error } = await supabase.from('posts').delete().eq('id', id)
            if (error) {
                toast.error('Delete failed')
                setReviewStatus(prev => {
                    const newSt = { ...prev }
                    delete newSt[id]
                    return newSt
                })
            } else {
                toast.success('Post Deleted')
                // Keep it visible but stamped 'REMOVED' for the session
            }
        } else {
            // Save review status to database
            const { error } = await supabase
                .from('posts')
                .update({
                    review_status: status,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) {
                console.error('Review error:', error)
                toast.error('Failed to save review')
                setReviewStatus(prev => {
                    const newSt = { ...prev }
                    delete newSt[id]
                    return newSt
                })
            } else {
                toast.success(`Marked as ${status.toUpperCase()}`)
            }
        }
    }

    // Group by Date
    const groupedMedia = media.reduce((acc, post) => {
        const today = new Date().toLocaleDateString()
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
        const postDate = post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown Date'

        let groupKey = postDate
        if (postDate === today) {
            groupKey = 'Today'
        } else if (postDate === yesterday) {
            groupKey = 'Yesterday'
        }

        if (!acc[groupKey]) acc[groupKey] = []
        acc[groupKey].push(post)
        return acc
    }, {})

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Eye className="text-blue-600" /> Media Review Queue
                </h1>
                <span className="text-sm text-gray-500">Last 50 Media Posts</span>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading media content...</div>
            ) : media.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Media Found</h3>
                    <p className="text-gray-500">No posts with images were found in the database.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedMedia).map(([date, posts]) => (
                        <div key={date} className="animate-fade-in">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">{date}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.map(post => {
                                    const status = reviewStatus[post.id]
                                    const isRemoved = status === 'removed'
                                    const isSafe = status === 'safe'
                                    const isRestricted = status === 'restricted'

                                    return (
                                        <div key={post.id} className={`bg-white border rounded-lg overflow-hidden flex flex-col shadow-sm transition-all relative ${isRemoved ? 'opacity-50 grayscale' : ''} ${status ? 'ring-2 ring-offset-2' : ''} ${isSafe ? 'ring-green-500' : isRestricted ? 'ring-yellow-500' : isRemoved ? 'ring-red-500' : 'border-gray-200'}`}>

                                            {/* STAMP OVERLAY */}
                                            {status && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                    <div className={`
                                                        border-4 rounded-lg px-4 py-1 font-black text-2xl uppercase -rotate-12 opacity-80 backdrop-blur-sm
                                                        ${isSafe ? 'border-green-600 text-green-600 bg-green-50/50' :
                                                            isRestricted ? 'border-yellow-600 text-yellow-600 bg-yellow-50/50' :
                                                                'border-red-600 text-red-600 bg-red-50/50'}
                                                    `}>
                                                        {status}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    {post.profiles?.profile_picture_url ? (
                                                        <img src={post.profiles.profile_picture_url} className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                                    )}
                                                    <span className="font-bold truncate max-w-[100px]">{post.profiles?.username || 'Unknown'}</span>
                                                </div>
                                                <span className="font-mono text-[10px] text-gray-400">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            {/* Media */}
                                            <div className="relative group bg-black aspect-video flex items-center justify-center overflow-hidden">
                                                {post.content_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                    <video src={post.content_url} className="w-full h-full object-contain" controls />
                                                ) : (
                                                    <img
                                                        src={post.content_url}
                                                        alt="Review content"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/300?text=Error+Loading'
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Body */}
                                            <div className="p-3 flex-1 border-b border-gray-100">
                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{post.title}</h4>
                                                <p className="text-gray-500 text-xs line-clamp-2 mt-1">{post.content}</p>
                                            </div>

                                            {/* Quick Actions (Only visible if not removed) */}
                                            {!isRemoved && (
                                                <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50">
                                                    <button
                                                        onClick={() => markPost(post.id, 'safe')}
                                                        className="p-3 hover:bg-green-50 text-gray-400 hover:text-green-600 flex justify-center transition-colors"
                                                        title="Mark Safe"
                                                    >
                                                        <ShieldCheck size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => markPost(post.id, 'restricted')}
                                                        className="p-3 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 flex justify-center transition-colors"
                                                        title="Restrict"
                                                    >
                                                        <EyeOff size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => markPost(post.id, 'removed')}
                                                        className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 flex justify-center transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
