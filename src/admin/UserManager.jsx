import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CheckCircle, Shield, ArrowLeft, Activity, Mail, Calendar, User, Trash2, Bell, Gift, AlertTriangle, Star, Megaphone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Avatar from '../components/Avatar'

export default function UserManager() {
    const { userId } = useParams()
    const [profile, setProfile] = useState(null)
    const [recentPosts, setRecentPosts] = useState([])
    const [promptHistory, setPromptHistory] = useState([])
    const [templates, setTemplates] = useState([])
    const [verificationInfo, setVerificationInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchUserData()
        fetchTemplates()
    }, [userId])

    const fetchTemplates = async () => {
        const { data } = await supabase.from('prompt_templates').select('*').order('title')
        if (data) setTemplates(data)
    }

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

            // Fetch Verification Info
            const { data: vData } = await supabase
                .from('verification_requests')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            if (vData) setVerificationInfo(vData)

            // Fetch Prompts
            const { data: prompts } = await supabase
                .from('user_prompts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
            setPromptHistory(prompts || [])

            // Fetch Recent Activity (Posts)
            try {
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('id, title, created_at, type')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (postsError) throw postsError
                setRecentPosts(postsData || [])
            } catch (err) {
                console.warn('Recent posts sort failed, retrying...', err)
                const { data: postsRetry } = await supabase
                    .from('posts')
                    .select('id, title, created_at, type')
                    .eq('user_id', userId)
                    .limit(10)
                setRecentPosts(postsRetry || [])
            }

        } catch (error) {
            console.error(error)
            toast.error('Failed to load user')
        } finally {
            setLoading(false)
        }
    }

    const deletePrompt = async (id) => {
        if (!window.confirm('Delete this prompt log?')) return
        const { error } = await supabase.from('user_prompts').delete().eq('id', id)

        if (error) {
            toast.error('Failed to delete prompt')
        } else {
            setPromptHistory(prev => prev.filter(p => p.id !== id))
            toast.success('Prompt deleted')
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

    // Prompt/Notification State
    const [promptTitle, setPromptTitle] = useState('')
    const [promptMessage, setPromptMessage] = useState('')
    const [promptActionLabel, setPromptActionLabel] = useState('')
    const [promptActionUrl, setPromptActionUrl] = useState('')
    const [promptType, setPromptType] = useState('info') // info, success, warning, error
    const [promptIcon, setPromptIcon] = useState('bell')

    // Available prompt icons
    const PROMPT_ICONS = [
        { id: 'bell', icon: Bell, label: 'Bell' },
        { id: 'gift', icon: Gift, label: 'Gift' },
        { id: 'alert', icon: AlertTriangle, label: 'Alert' },
        { id: 'star', icon: Star, label: 'Star' },
        { id: 'megaphone', icon: Megaphone, label: 'Announce' },
    ]

    const sendPrompt = async () => {
        if (!promptTitle) return toast.error('Title is required')
        setProcessing(true)

        const { error } = await supabase
            .from('user_prompts')
            .insert({
                user_id: userId,
                title: promptTitle,
                message: promptMessage,
                action_label: promptActionLabel || null,
                action_url: promptActionUrl || null,
                type: promptType,
                icon: promptIcon
            })

        if (error) {
            toast.error('Failed to send prompt: ' + error.message)
            console.error(error)
        } else {
            toast.success('Prompt Sent!')
            setPromptTitle('')
            setPromptMessage('')
            setPromptActionLabel('')
            setPromptActionUrl('')
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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

                        {/* Send Prompt / Notification */}
                        <div className="space-y-3 border border-gray-100 p-4 rounded bg-gray-50">
                            <h3 className="font-bold text-sm text-gray-700 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Shield size={14} className="text-blue-500" /> Send User Prompt</span>
                            </h3>

                            {/* Template Selector */}
                            <select
                                className="w-full text-xs p-2 border rounded bg-white text-gray-600 mb-2"
                                onChange={(e) => {
                                    if (!e.target.value) return
                                    const t = JSON.parse(e.target.value)
                                    setPromptTitle(t.title)
                                    setPromptMessage(t.message)
                                    setPromptType(t.type)
                                    setPromptActionUrl(t.action_url)
                                    setPromptActionLabel(t.action_label || 'View')
                                }}
                            >
                                <option value="">Load Template...</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={JSON.stringify(t)}>{t.type.toUpperCase()} - {t.title}</option>
                                ))}
                            </select>

                            <input
                                placeholder="Title (e.g. Complete Profile)"
                                className="w-full text-xs p-2 border rounded"
                                value={promptTitle} onChange={e => setPromptTitle(e.target.value)}
                            />
                            <textarea
                                placeholder="Message body..."
                                className="w-full text-xs p-2 border rounded resize-none" rows={2}
                                value={promptMessage} onChange={e => setPromptMessage(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Btn Label (Optional)"
                                    className="w-full text-xs p-2 border rounded"
                                    value={promptActionLabel} onChange={e => setPromptActionLabel(e.target.value)}
                                />
                                <select
                                    className="w-full text-xs p-2 border rounded bg-white"
                                    value={promptType} onChange={e => setPromptType(e.target.value)}
                                >
                                    <option value="info">Info (Blue)</option>
                                    <option value="success">Success (Green)</option>
                                    <option value="warning">Warning (Yellow)</option>
                                    <option value="error">Error (Red)</option>
                                </select>
                            </div>
                            <input
                                placeholder="Action URL (e.g. /settings)"
                                className="w-full text-xs p-2 border rounded"
                                value={promptActionUrl} onChange={e => setPromptActionUrl(e.target.value)}
                            />

                            {/* Icon Selector */}
                            <div className="mt-2">
                                <label className="text-xs text-gray-500 mb-1 block">Select Icon:</label>
                                <div className="flex gap-2">
                                    {PROMPT_ICONS.map(({ id, icon: Icon, label }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setPromptIcon(id)}
                                            className={`p-2 rounded-lg border transition-all ${promptIcon === id
                                                ? 'bg-blue-100 border-blue-400 text-blue-600'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-blue-50'
                                                }`}
                                            title={label}
                                        >
                                            <Icon size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={sendPrompt}
                                disabled={processing || !promptTitle}
                                className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50 mt-3"
                            >
                                Send Prompt
                            </button>
                        </div>
                    </div>

                    {/* Check History */}
                    <div className="mt-8 space-y-4">
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-700 text-sm">
                                Prompt History
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-2">Type</th>
                                            <th className="p-2">Title</th>
                                            <th className="p-2">Message</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2 text-right">Date</th>
                                            <th className="p-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {promptHistory?.map(h => (
                                            <tr key={h.id}>
                                                <td className="p-2 text-xs uppercase font-bold text-gray-500">{h.type}</td>
                                                <td className="p-2 font-medium">{h.title}</td>
                                                <td className="p-2 text-gray-500 truncate max-w-[200px]" title={h.message}>{h.message}</td>
                                                <td className="p-2 text-xs">
                                                    {h.is_dismissed ? <span className="text-gray-400">Dismissed</span> : <span className="text-green-600 font-bold">Active</span>}
                                                </td>
                                                <td className="p-2 text-right text-xs text-gray-400">
                                                    {new Date(h.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 text-right">
                                                    <button
                                                        onClick={() => deletePrompt(h.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete History"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!promptHistory || promptHistory.length === 0) && (
                                            <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">No prompts sent yet</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="grid grid-cols-2 gap-4 mt-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span>{profile.email || 'No email visible'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Joined: {new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={14} />
                            <span className="font-semibold text-gray-800">{verificationInfo?.full_name || 'Name not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>DOB: {verificationInfo?.date_of_birth ? new Date(verificationInfo.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="font-bold">Bio:</span>
                            <p className="italic text-gray-500 mt-1 text-xs">{profile.bio || 'No bio'}</p>
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
        </div >
    )
}
