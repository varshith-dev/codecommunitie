import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Avatar from './Avatar'
import VerifiedBadge from './VerifiedBadge'
import { Link } from 'react-router-dom'

export default function UserListModal({ userId, type, onClose, title }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [userId, type])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            let profileIds = []

            if (type === 'followers') {
                const { data: follows } = await supabase
                    .from('follows')
                    .select('follower_id')
                    .eq('following_id', userId)
                profileIds = follows?.map(f => f.follower_id) || []
            } else {
                const { data: follows } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', userId)
                profileIds = follows?.map(f => f.following_id) || []
            }

            if (profileIds.length > 0) {
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', profileIds)

                if (error) console.error(error)
                setUsers(profiles || [])
            } else {
                setUsers([])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : users.length > 0 ? (
                        <div className="space-y-1">
                            {users.map(user => (
                                <Link
                                    key={user.id}
                                    to={`/user/${user.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                                >
                                    <Avatar src={user.profile_picture_url} size="md" />
                                    <div>
                                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                                            {user.display_name || user.username}
                                            {user.is_verified && <VerifiedBadge size={14} />}
                                        </p>
                                        <p className="text-sm text-gray-500">@{user.username}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
