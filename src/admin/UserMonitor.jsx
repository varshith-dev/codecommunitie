import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Ban, CheckCircle, AlertTriangle, MessageSquare, Eye, X, ShieldAlert, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function UserMonitor() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    // Message Modal State
    const [showMessageModal, setShowMessageModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [promptTitle, setPromptTitle] = useState('')
    const [promptMessage, setPromptMessage] = useState('')
    const [promptType, setPromptType] = useState('info')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.warn('UserMonitor fetch failed:', err.message)
        }
        setLoading(false)
    }

    const handleBan = async (user) => {
        if (!window.confirm(`Are you sure you want to ${user.is_banned ? 'UNBAN' : 'BAN'} ${user.username}?`)) return

        const newVal = !user.is_banned
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: newVal })
            .eq('id', user.id)

        if (error) {
            toast.error('Action failed')
        } else {
            setUsers(users.map(u => u.id === user.id ? { ...u, is_banned: newVal } : u))
            toast.success(newVal ? 'User Banned' : 'User Restored')
        }
    }

    const openMessageModal = (user) => {
        setSelectedUser(user)
        setPromptTitle('')
        setPromptMessage('')
        setShowMessageModal(true)
    }

    const sendMessage = async () => {
        if (!promptTitle || !promptMessage) return toast.error('All fields required')

        const { error } = await supabase
            .from('user_prompts')
            .insert({
                user_id: selectedUser.id,
                title: promptTitle,
                message: promptMessage,
                type: promptType,
                action_url: '/settings', // Default action
                action_label: 'View Settings'
            })

        if (error) {
            toast.error('Failed to send message')
        } else {
            toast.success('Message sent successfully')
            setShowMessageModal(false)
        }
    }

    const filteredUsers = users.filter(u =>
        (u.username?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (u.display_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 relative pb-20">
            {/* Toolbar */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3 text-gray-500 w-full max-w-md bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-medium"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm font-medium text-gray-500">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                        {filteredUsers.length} Users Found
                    </span>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Display Name</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500 animate-pulse">
                                    Loading users...
                                </td>
                            </tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">@{user.username || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 font-medium">{user.display_name || '-'}</td>
                                    <td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        {user.is_banned ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                <Ban size={12} /> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openMessageModal(user)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Send Message"
                                            >
                                                <MessageSquare size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleBan(user)}
                                                className={`p-2 rounded-lg transition-colors border border-transparent ${user.is_banned
                                                        ? 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100'
                                                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                                                    }`}
                                                title={user.is_banned ? "Unban User" : "Ban User"}
                                            >
                                                {user.is_banned ? <ShieldAlert size={18} /> : <Ban size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MESSAGE MODAL */}
            {showMessageModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <MessageSquare className="text-blue-600" size={20} />
                                Send Admin Prompt
                            </h3>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="text-sm text-gray-500 mb-2">
                                Sending message to <span className="font-bold text-gray-900">@{selectedUser?.username}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
                                <input
                                    className="w-full bg-white border border-gray-200 text-gray-900 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                                    value={promptTitle}
                                    onChange={e => setPromptTitle(e.target.value)}
                                    placeholder="e.g. Profile Incomplete"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Message</label>
                                <textarea
                                    className="w-full bg-white border border-gray-200 text-gray-900 p-3 rounded-xl h-32 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                                    value={promptMessage}
                                    onChange={e => setPromptMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Type</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 text-gray-900 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                        value={promptType}
                                        onChange={e => setPromptType(e.target.value)}
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="success">Success (Green)</option>
                                        <option value="error">Critical (Red)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendMessage}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            >
                                <Send size={16} /> Send Prompt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
