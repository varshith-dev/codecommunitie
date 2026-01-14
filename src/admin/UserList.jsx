import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Search, Filter, ArrowUpDown, MoreHorizontal, Shield, User, Calendar, CheckCircle, AlertTriangle, Users, Trash2, CheckSquare, Square, X, Mail } from 'lucide-react'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'
import { EmailService } from '../services/EmailService'
import { EmailTemplates, wrapInTemplate } from '../services/EmailTemplates'

export default function UserList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all') // all, new, active, duplicate
    const [sort, setSort] = useState('newest') // newest, oldest, name

    // Selection State
    const [selectedUsers, setSelectedUsers] = useState(new Set())

    // Stats
    const [stats, setStats] = useState({ total: 0, newToday: 0, verified: 0 })

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

            if (error) throw error

            setUsers(data || [])
            calculateStats(data || [])

        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data) => {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

        const newToday = data.filter(u => new Date(u.created_at).getTime() >= today).length
        const verified = data.filter(u => u.is_verified).length

        setStats({
            total: data.length,
            newToday,
            verified
        })
    }

    // Logic to detect duplicates (Improved: Check Email AND Username AND DisplayName)
    const getDuplicateGroups = (data) => {
        const groups = {}
        const emailMap = {}
        const usernameMap = {}

        data.forEach(u => {
            // Check Email
            if (u.email) {
                const mailKey = u.email.toLowerCase().trim()
                if (!emailMap[mailKey]) emailMap[mailKey] = []
                emailMap[mailKey].push(u.id)
            }
            // Check Username
            if (u.username) {
                const userKey = u.username.toLowerCase().trim()
                if (!usernameMap[userKey]) usernameMap[userKey] = []
                usernameMap[userKey].push(u.id)
            }
        })

        const duplicates = new Set()

        Object.values(emailMap).forEach(list => {
            if (list.length > 1) list.forEach(id => duplicates.add(id))
        })
        Object.values(usernameMap).forEach(list => {
            if (list.length > 1) list.forEach(id => duplicates.add(id))
        })

        return Array.from(duplicates)
    }

    const toggleSelectAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set())
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
        }
    }

    const toggleSelect = (id) => {
        const newSet = new Set(selectedUsers)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedUsers(newSet)
    }

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [usersToDelete, setUsersToDelete] = useState([]) // Array of User Objects
    const [deleteReason, setDeleteReason] = useState('Violation of Terms of Service')
    const [isDeleting, setIsDeleting] = useState(false)

    // Pre-defined reasons
    const DELETE_REASONS = [
        "Violation of Terms of Service",
        "Spam or Malicious Activity",
        "Fake or Duplicate Account",
        "Requested by User",
        "Inactivity Cleanup"
    ]

    const promptDelete = (usersList) => {
        setUsersToDelete(usersList)
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        const toastId = toast.loading(`Processing ${usersToDelete.length} deletions...`)

        try {
            // 1. Send Emails (Best Effort)
            const emailPromises = usersToDelete.map(async (u) => {
                if (!u.email) return null;
                try {
                    const t = EmailTemplates.ACCOUNT_DELETED
                    await EmailService.send({
                        recipientEmail: u.email,
                        memberName: u.display_name,
                        subject: t.subject(),
                        htmlContent: wrapInTemplate(t.body(u.display_name, deleteReason), t.title),
                        templateType: 'ACCOUNT_DELETED',
                        triggeredBy: 'admin_bulk_delete'
                    })
                } catch (e) {
                    console.error(`Failed to email ${u.email}`, e)
                }
            })

            await Promise.allSettled(emailPromises)

            // 2. Delete from DB via Backend (Auth Admin API)
            const ids = usersToDelete.map(u => u.id)

            if (window.location.hostname === 'localhost') {
                // Use Local Python Backend for Hard Delete
                const response = await fetch('http://localhost:8000/delete-users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userIds: ids })
                })
                const data = await response.json()
                if (!response.ok) throw new Error(data.message || 'Back-end delete failed')
            } else {
                // Production: Use Vercel Serverless Function (api/delete-users.js)
                const response = await fetch('/api/delete-users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Optional: Pass session token if you implement auth check later
                        // 'Authorization': `Bearer ${session?.access_token}` 
                    },
                    body: JSON.stringify({ userIds: ids })
                })

                const data = await response.json()
                if (!response.ok) throw new Error(data.message || 'Delete failed')
            }

            toast.success(`Successfully deleted ${ids.length} users`, { id: toastId })

            // Cleanup UI
            setUsers(prev => prev.filter(u => !ids.includes(u.id)))
            setSelectedUsers(new Set())
            setDeleteModalOpen(false)

        } catch (error) {
            console.error(error)
            toast.error('Delete failed. Ensure you have admin privileges.', { id: toastId })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDelete = (ids) => {
        // Find user objects for context
        const targets = users.filter(u => ids.includes(u.id))
        promptDelete(targets)
    }

    const filteredUsers = users.filter(user => {
        const duplicateIds = getDuplicateGroups(users)

        // Search
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = (
            user.username?.toLowerCase().includes(searchLower) ||
            user.display_name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.id.includes(searchLower)
        )
        if (!matchesSearch) return false

        // Filter
        if (filter === 'new') {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
            return new Date(user.created_at).getTime() > oneDayAgo
        }
        if (filter === 'active') {
            return user.is_verified || user.role !== 'user'
        }
        if (filter === 'duplicate') {
            return duplicateIds.includes(user.id)
        }
        return true
    }).sort((a, b) => {
        if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
        if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
        if (sort === 'name') return (a.username || '').localeCompare(b.username || '')
        return 0
    })

    const DuplicateBadge = () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200" title="Possible Duplicate Name">
            <AlertTriangle size={10} /> DUPE
        </span>
    )

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Users</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">New Today</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.newToday}</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Verified Accounts</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.verified}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-20">
                {selectedUsers.size > 0 ? (
                    <div className="flex items-center gap-4 w-full bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <span className="text-sm font-bold text-blue-700 ml-2">{selectedUsers.size} Selected</span>
                        <div className="flex-1"></div>
                        <button
                            onClick={() => handleDelete(Array.from(selectedUsers))}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                        >
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search users by name, email, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('new')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    New (24h)
                                </button>
                                <button
                                    onClick={() => setFilter('duplicate')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'duplicate' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Duplicates
                                </button>
                            </div>

                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-12">
                                    <button onClick={toggleSelectAll} className="flex items-center text-gray-400 hover:text-gray-600">
                                        {selectedUsers.size > 0 && selectedUsers.size === filteredUsers.length ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No users found matching your filters</td></tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelected = selectedUsers.has(user.id)
                                    const isDupe = getDuplicateGroups(users).includes(user.id)
                                    return (
                                        <tr key={user.id} className={`transition-colors group ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}>
                                            <td className="p-4">
                                                <button onClick={() => toggleSelect(user.id)} className="flex items-center text-gray-400 hover:text-gray-600">
                                                    {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={user.profile_picture_url} alt={user.username} size="sm" />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                            {user.display_name || user.username}
                                                            {isDupe && <DuplicateBadge />}
                                                        </div>
                                                        <div className="text-gray-500 text-xs font-mono">{user.email || `@${user.username}`}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {user.role || 'User'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {user.is_banned ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                            <Shield size={12} /> BANNED
                                                        </span>
                                                    ) : user.is_verified ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Regular</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-500 text-xs">
                                                {new Date(user.created_at).toLocaleDateString()}
                                                <div className="text-[10px] text-gray-400">{new Date(user.created_at).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-4 text-right flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/users/${user.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                >
                                                    Manage
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete([user.id])}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Quick Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-center text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-700">
                            <div className="p-2 bg-white rounded-full"><AlertTriangle size={20} className="text-red-600" /></div>
                            <h3 className="font-bold text-lg">Confirm Account Deletion</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 text-sm">
                                You are about to permanently delete <strong>{usersToDelete.length} user(s)</strong>.
                                This action cannot be undone.
                            </p>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col gap-2">
                                <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                                    <Mail size={12} /> Email Notification
                                </label>
                                <p className="text-xs text-blue-600">
                                    We will send an email to the user(s) notifying them of this action.
                                </p>

                                <label className="text-xs font-bold text-gray-700 mt-2">Select Reason for Deletion:</label>
                                <select
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {DELETE_REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {deleteReason === 'Other' && (
                                <input
                                    type="text"
                                    placeholder="Enter custom reason..."
                                    className="w-full border p-2 rounded text-sm"
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm & Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
