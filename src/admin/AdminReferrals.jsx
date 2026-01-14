import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Gift, Users, Search, ArrowUpRight } from 'lucide-react'
import Avatar from '../components/Avatar'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminReferrals() {
    const [referrals, setReferrals] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ totalReferrals: 0, totalReferees: 0 })

    useEffect(() => {
        fetchReferrals()
    }, [])

    const fetchReferrals = async () => {
        setLoading(true)
        try {
            // Fetch all referrals with referrer details
            const { data, error } = await supabase
                .from('referrals')
                .select(`
                    *,
                    referrer:referrer_id (
                        id,
                        username,
                        display_name,
                        profile_picture_url,
                        email
                    )
                `)
                .order('uses_count', { ascending: false })

            if (error) throw error

            setReferrals(data || [])

            // Calculate stats
            const totalRef = data.length
            const totalUses = data.reduce((sum, item) => sum + (item.uses_count || 0), 0)
            setStats({ totalReferrals: totalRef, totalReferees: totalUses })

        } catch (error) {
            console.error('Error fetching referrals:', error)
            toast.error('Failed to load referrals')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Gift className="text-blue-600" /> Referral Program Stats
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Gift size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Referral Codes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Users Referred</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalReferees}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Referrals List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Top Referrers</h3>
                    <span className="text-xs text-gray-500">Sorted by highest impact</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading referral data...</div>
                ) : referrals.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No referral codes generated yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Referrer</th>
                                    <th className="px-6 py-3 font-medium">Code</th>
                                    <th className="px-6 py-3 font-medium text-center">Invited Users</th>
                                    <th className="px-6 py-3 font-medium text-right">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {referrals.map((ref) => (
                                    <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={ref.referrer?.profile_picture_url} size="sm" />
                                                <div>
                                                    <div className="font-medium text-gray-900 flex items-center gap-1">
                                                        {ref.referrer?.display_name || 'Unknown'}
                                                        <Link to={`/admin/users/${ref.referrer?.id}`} target="_blank">
                                                            <ArrowUpRight size={12} className="text-gray-400 hover:text-blue-500" />
                                                        </Link>
                                                    </div>
                                                    <div className="text-xs text-gray-500">@{ref.referrer?.username || 'unknown'}</div>
                                                    <div className="text-xs text-gray-400">{ref.referrer?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-700 bg-gray-50 w-fit rounded block my-auto">
                                            {ref.referral_code}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ref.uses_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {ref.uses_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {new Date(ref.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
