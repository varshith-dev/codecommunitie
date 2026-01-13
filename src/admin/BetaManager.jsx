import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Users, Sparkles, Plus, Search, X, Check, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../components/Avatar'

export default function BetaManager() {
    const [features, setFeatures] = useState([])
    const [users, setUsers] = useState([])
    const [accessList, setAccessList] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedFeature, setSelectedFeature] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch beta features
            const { data: featureData } = await supabase
                .from('feature_flags')
                .select('*')
                .eq('is_beta', true)
                .order('name')

            setFeatures(featureData || [])
            if (featureData?.length > 0 && !selectedFeature) {
                setSelectedFeature(featureData[0].id)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedFeature) {
            fetchAccessList()
        }
    }, [selectedFeature])

    const fetchAccessList = async () => {
        try {
            const { data } = await supabase
                .from('user_feature_access')
                .select(`
                    user_id,
                    granted_at,
                    user:user_id (
                        id, username, display_name, profile_picture_url
                    )
                `)
                .eq('feature_id', selectedFeature)
                .order('granted_at', { ascending: false })

            setAccessList(data || [])
        } catch (error) {
            console.error('Error fetching access list:', error)
        }
    }

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        setSearching(true)
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, display_name, profile_picture_url')
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(5)

            // Filter out users who already have access
            const existingIds = accessList.map(a => a.user_id)
            setSearchResults(data?.filter(u => !existingIds.includes(u.id)) || [])
        } catch (error) {
            console.error('Error searching:', error)
        } finally {
            setSearching(false)
        }
    }

    const grantAccess = async (userId) => {
        try {
            const { error } = await supabase
                .from('user_feature_access')
                .insert({
                    user_id: userId,
                    feature_id: selectedFeature
                })

            if (error) throw error

            toast.success('Beta access granted')
            setSearchQuery('')
            setSearchResults([])
            fetchAccessList()
        } catch (error) {
            console.error(error)
            toast.error('Failed to grant access')
        }
    }

    const revokeAccess = async (userId) => {
        if (!window.confirm('Revoke beta access for this user?')) return

        try {
            const { error } = await supabase
                .from('user_feature_access')
                .delete()
                .eq('user_id', userId)
                .eq('feature_id', selectedFeature)

            if (error) throw error

            toast.success('Access revoked')
            fetchAccessList()
        } catch (error) {
            toast.error('Failed to revoke access')
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="h-64 bg-gray-200 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users size={24} />
                    Beta Access Manager
                </h1>
                <p className="text-sm text-gray-500">Manage user access to beta features</p>
            </div>

            {/* Feature Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {features.map(feature => (
                    <button
                        key={feature.id}
                        onClick={() => setSelectedFeature(feature.id)}
                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${selectedFeature === feature.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <Sparkles size={14} />
                        {feature.name}
                    </button>
                ))}
            </div>

            {features.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <Sparkles size={40} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No Beta Features</h3>
                    <p className="text-sm text-gray-500">Mark features as beta in the Feature Manager first</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Add User Section */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    searchUsers(e.target.value)
                                }}
                                placeholder="Search users to grant access..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                            />
                            {searching && (
                                <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={18} />
                            )}
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-lg divide-y">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={user.profile_picture_url} size="sm" />
                                            <div>
                                                <div className="font-medium text-gray-900">{user.display_name}</div>
                                                <div className="text-sm text-gray-500">@{user.username}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => grantAccess(user.id)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Access List */}
                    <div className="divide-y divide-gray-100">
                        {accessList.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No users have access to this beta feature yet
                            </div>
                        ) : (
                            accessList.map(access => (
                                <div key={access.user_id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={access.user?.profile_picture_url} size="md" />
                                        <div>
                                            <div className="font-medium text-gray-900">{access.user?.display_name}</div>
                                            <div className="text-sm text-gray-500">@{access.user?.username}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400">
                                            {new Date(access.granted_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => revokeAccess(access.user_id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stats */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                        {accessList.length} user{accessList.length !== 1 && 's'} with beta access
                    </div>
                </div>
            )}
        </div>
    )
}
