import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CheckCircle, Shield, ArrowLeft, Activity, Mail, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Avatar from '../components/Avatar'

export default function UserManager() {
    const { userId } = useParams()
    const [profile, setProfile] = useState(null)
    const [recentPosts, setRecentPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchUserData()
    }, [userId])

    const fetchUserData = async () => {
        setLoading(true)
        try {
            // Fetch Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(profileData)

            // Fetch Recent Activity (Posts)
            const { data: postsData } = await supabase
                .from('posts')
                .select('id, title, created_at, type')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)

            setRecentPosts(postsData || [])

        } catch (error) {
            console.error(error)
            toast.error('Failed to load user')
        } finally {
            setLoading(false)
        }
    }

    const toggleVerification = async () => {
        setProcessing(true)
        const newVal = !profile.is_verified

        const { data, error } = await supabase
            .from('profiles')
            .update({ is_verified: newVal })
            .eq('id', userId)
            .select()

        if (error) {
            toast.error('Update failed: ' + error.message)
        } else if (!data || data.length === 0) {
            toast.error('Update failed: Permission denied')
        } else {
            setProfile(prev => ({ ...prev, is_verified: newVal }))
            toast.success(newVal ? 'User Verified' : 'User Un-verified')
        }
        setProcessing(false)
    }

    const toggleBan = async () => {
        if (!window.confirm(profile.is_banned ? 'Unban this user?' : 'Are you sure you want to BAN this user?')) return
        setProcessing(true)
        const newVal = !profile.is_banned

        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: newVal })
            .eq('id', userId)

        if (error) {
            toast.error('Update failed')
        } else {
            setProfile(prev => ({ ...prev, is_banned: newVal }))
            toast.success(newVal ? 'User Banned' : 'User Unbanned')
        }
        setProcessing(false)
    }



    const updateRole = async (newRole) => {
        if (!window.confirm(`Promote this user to ${newRole}?`)) return
        setProcessing(true)

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) {
            toast.error('Update failed')
        } else {
            setProfile(prev => ({ ...prev, role: newRole }))
            toast.success(`Role updated to ${newRole}`)
        }
        setProcessing(false)
    }

    if (loading) return <div className="p-8 text-center">Loading User Data...</div>
    if (!profile) return <div className="p-8 text-center">User not found</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link to="/admin/table/profiles" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4">
                <ArrowLeft size={16} /> Back to Profiles
            </Link>

            <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                    <Avatar src={profile.profile_picture_url} alt={profile.username} size="xl" />
                </div>

                <div className="flex-1 w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.display_name || profile.username}
                                {profile.is_verified && <CheckCircle className="text-white bg-blue-500 rounded-full p-0.5" size={20} />}
                            </h1>
                            <p className="text-gray-500">@{profile.username}</p>
                        </div>
                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {profile.id}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {/* Status Controls */}
                        <div className="space-y-4 border border-gray-100 p-4 rounded bg-gray-50">
                            <h3 className="font-bold text-sm text-gray-700">Account Status</h3>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Verified Badge</span>
                                <button
                                    onClick={toggleVerification}
                                    disabled={processing}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${profile.is_verified
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                                        }`}
                                >
                                    {profile.is_verified ? 'Revoke Verification' : 'Grant Verification'}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Banned Status</span>
                                <button
                                    onClick={toggleBan}
                                    disabled={processing}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${profile.is_banned
                                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                        }`}
                                >
                                    {profile.is_banned ? 'Unban User' : 'Ban User'}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Role</span>
                                <select
                                    value={profile.role || 'user'}
                                    onChange={(e) => updateRole(e.target.value)}
                                    disabled={processing}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                >
                                    <option value="user">User</option>
                                    <option value="advertiser">Advertiser (Green Tick)</option>
                                    <option value="moderator">Moderator (Gold Tick)</option>
                                    <option value="admin">Admin (Gold Tick)</option>
                                </select>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="space-y-2 text-sm text-gray-600 p-4">
                            <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span>{profile.email || 'No email visible'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Joined: {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-2">
                                <span className="font-bold">Bio:</span>
                                <p className="italic text-gray-500 mt-1 text-xs">{profile.bio || 'No bio'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Activity size={16} className="text-gray-500" />
                    <h3 className="font-bold text-gray-700 text-sm">Recent Activity</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b border-gray-200">
                        <tr>
                            <th className="p-3">Action</th>
                            <th className="p-3">Detail</th>
                            <th className="p-3 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentPosts.length > 0 ? recentPosts.map(post => (
                            <tr key={post.id} className="hover:bg-gray-50">
                                <td className="p-3">
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded textxs font-medium">
                                        POSTED {post.type?.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-3 font-medium text-gray-800">
                                    {post.title || 'Untitled Post'}
                                </td>
                                <td className="p-3 text-right text-gray-500 text-xs">
                                    {new Date(post.created_at).toLocaleString()}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="p-4 text-center text-gray-500 italic">No recent activity</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
