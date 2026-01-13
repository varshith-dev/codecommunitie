import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Search, User, CheckCircle, Shield, Filter, Mail, Loader, CheckSquare, Square } from 'lucide-react'
import Avatar from '../../components/Avatar'

export default function EmailAudience({ onSelectUsers }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [filters, setFilters] = useState({
        search: '',
        role: 'all', // all, user, moderator, admin
        verified: 'all', // all, verified, unverified
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Basic fetch of first 100 users for now.
            // In a real app with thousands of users, we'd implementing server-side filtering/pagination.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .limit(100)
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Failed to fetch audience', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase()
            const match =
                user.username?.toLowerCase().includes(q) ||
                user.display_name?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q)
            if (!match) return false
        }

        // Verified
        if (filters.verified !== 'all') {
            const isV = filters.verified === 'verified'
            if (user.is_verified !== isV) return false
        }

        // Role
        if (filters.role !== 'all') {
            if (user.role !== filters.role) return false
        }

        return true
    })

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredUsers.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredUsers.map(u => u.id)))
        }
    }

    const toggleSelectOne = (id) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleSendAction = () => {
        // Get full user objects for selected IDs
        const selectedUsers = users.filter(u => selectedIds.has(u.id))
        onSelectUsers(selectedUsers)
    }

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Audience...</div>

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, username..."
                        className="w-full text-sm outline-none"
                        value={filters.search}
                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <select
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 hover:bg-white transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-100"
                        value={filters.verified}
                        onChange={e => setFilters(prev => ({ ...prev, verified: e.target.value }))}
                    >
                        <option value="all">All Status</option>
                        <option value="verified">Verified Only</option>
                        <option value="unverified">Unverified Only</option>
                    </select>

                    <select
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-gray-50 hover:bg-white transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-100"
                        value={filters.role}
                        onChange={e => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                    </select>

                    <button
                        onClick={handleSendAction}
                        disabled={selectedIds.size === 0}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Mail size={16} />
                        Email {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                    </button>
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-auto bg-gray-50/50">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                    {selectedIds.size > 0 && selectedIds.size === filteredUsers.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                </button>
                            </th>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No users found.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.has(user.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => toggleSelectOne(user.id)} className="text-gray-300 group-hover:text-gray-500">
                                            {selectedIds.has(user.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.profile_picture_url} size="md" />
                                            <div>
                                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                                    {user.display_name || 'No Name'}
                                                    {user.is_verified && <CheckCircle size={14} className="text-blue-500" fill="currentColor" color="white" />}
                                                </div>
                                                <div className="text-xs text-gray-500">@{user.username}</div>
                                                {/* Hidden email for search purposes, displayed if needed */}
                                                <div className="text-xs text-gray-400 hidden group-hover:block">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                                user.role === 'moderator' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }
                                        `}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-gray-400 text-xs font-mono">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Status Bar */}
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between px-4">
                <span>Showing {filteredUsers.length} users</span>
                <span>{selectedIds.size} selected</span>
            </div>
        </div>
    )
}
