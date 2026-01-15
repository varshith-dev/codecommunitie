import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
    LayoutDashboard, DollarSign, Users, MousePointerClick,
    TrendingUp, Activity, Archive, PauseCircle, PlayCircle, Loader, CheckCircle, XCircle, Eye, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import RollingCounter from '../components/RollingCounter'
import { useNavigate } from 'react-router-dom'

export default function AdminAdManager() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])
    const [pendingAds, setPendingAds] = useState([])
    const [creditRequests, setCreditRequests] = useState([])
    const [activeTab, setActiveTab] = useState('campaigns') // 'campaigns', 'pending', 'credits'
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeCampaigns: 0,
        totalImpressions: 0,
        totalClicks: 0,
        pendingApprovals: 0,
        pendingCredits: 0
    })

    useEffect(() => {
        fetchAdData()

        // Realtime subscription
        const subscription = supabase
            .channel('admin-ads-manager')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'advertisements' }, () => {
                fetchAdData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_campaigns' }, () => {
                fetchAdData()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_credit_requests' }, () => {
                fetchAdData()
            })
            .subscribe()

        return () => supabase.removeChannel(subscription)
    }, [])

    const fetchAdData = async () => {
        try {
            setLoading(true)

            // 1. Fetch Campaigns with Advertiser Info and ALL ads (including pending)
            const { data: rawCampaigns, error } = await supabase
                .from('ad_campaigns')
                .select(`
                    *,
                    advertiser:profiles(username, display_name),
                    ads:advertisements(id, impressions, clicks, status, approval_status, title, image_url)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            // 2. Fetch pending ads separately for approval tab with advertiser info
            const { data: pendingData, error: pendingError } = await supabase
                .from('advertisements')
                .select(`
                    *,
                    campaign:ad_campaigns(name, advertiser_id, profiles(username, display_name))
                `)
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: true })

            if (pendingError) {
                console.error('Error fetching pending ads:', pendingError)
            }

            setPendingAds(pendingData || [])

            // 3. Fetch Pending Credit Requests
            const { data: creditData, error: creditError } = await supabase
                .from('ad_credit_requests')
                .select(`
                    *,
                    advertiser:profiles(username, display_name, email)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })

            if (creditError) console.error('Error fetching credits:', creditError)
            setCreditRequests(creditData || [])

            // 4. Process Data
            let revenue = 0
            let impressions = 0
            let clicks = 0
            let active = 0
            let pending = 0

            const processedCampaigns = rawCampaigns.map(camp => {
                const campImpressions = camp.ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)
                const campClicks = camp.ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)
                const pendingCount = camp.ads.filter(ad => ad.approval_status === 'pending').length

                // Mock Revenue Calculation
                const estRevenue = (campImpressions / 1000 * 5) + (campClicks * 0.50)

                revenue += estRevenue
                impressions += campImpressions
                clicks += campClicks
                pending += pendingCount
                if (camp.status === 'active') active++

                return {
                    ...camp,
                    stats: {
                        impressions: campImpressions,
                        clicks: campClicks,
                        estRevenue,
                        pendingAds: pendingCount
                    }
                }
            })

            setCampaigns(processedCampaigns)
            setMetrics({
                totalRevenue: revenue,
                activeCampaigns: active,
                totalImpressions: impressions,
                totalClicks: clicks,
                pendingApprovals: pending,
                pendingCredits: creditData?.length || 0
            })

        } catch (error) {
            console.error('Error fetching ad data:', error)
            toast.error('Failed to load ad data')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (adId) => {
        try {
            const { error } = await supabase
                .from('advertisements')
                .update({
                    approval_status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', adId)

            if (error) throw error

            // Remove from pending list immediately
            setPendingAds(prev => prev.filter(ad => ad.id !== adId))

            toast.success('Ad approved!')

            // Refresh all data in background
            await fetchAdData()
        } catch (error) {
            console.error('Approval error:', error)
            toast.error('Failed to approve ad')
        }
    }

    const handleReject = async (adId) => {
        const reason = prompt('Rejection reason (optional):')
        try {
            const { error } = await supabase
                .from('advertisements')
                .update({
                    approval_status: 'rejected',
                    rejection_reason: reason || null
                })
                .eq('id', adId)

            if (error) throw error

            setPendingAds(prev => prev.filter(ad => ad.id !== adId))
            toast.success('Ad rejected')
            fetchAdData()
        } catch (error) {
            console.error('Rejection error:', error)
            toast.error('Failed to reject ad')
        }
    }

    const handleApproveCredit = async (requestId) => {
        try {
            const { error } = await supabase.rpc('approve_ad_credit_request', { request_id: requestId })
            if (error) throw error
            toast.success('Credits approved & added to wallet')
            fetchAdData()
        } catch (error) {
            console.error('Credit approval error:', error)
            toast.error('Failed to approve credits')
        }
    }

    const handleRejectCredit = async (requestId) => {
        try {
            const { error } = await supabase
                .from('ad_credit_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)
            if (error) throw error
            toast.success('Credit request rejected')
            fetchAdData()
        } catch (error) {
            toast.error('Failed to reject request')
        }
    })
                .eq('id', adId)

    if (error) throw error

    // Remove from pending list immediately
    setPendingAds(prev => prev.filter(ad => ad.id !== adId))

    toast.success('Ad rejected')

    // Refresh all data in background
    await fetchAdData()
} catch (error) {
    console.error('Rejection error:', error)
    toast.error('Failed to reject ad')
}
    }

if (loading) return (
    <div className="flex items-center justify-center p-20 text-gray-400">
        <Loader className="animate-spin mb-2" />
        <span className="ml-2">Loading Ad Metrics...</span>
    </div>
)

return (
    <div className="p-6 space-y-8 animate-fade-in">

        {/* Header */}
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-blue-600" />
                Ad Manager & Revenue
            </h1>
            <p className="text-gray-500">Monitor advertising campaigns and approve pending ads.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
                title="Est. Revenue"
                value={`₹${metrics.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                color="text-green-600"
                bg="bg-green-50"
            />
            <MetricCard
                title="Active Campaigns"
                value={metrics.activeCampaigns}
                icon={TrendingUp}
                color="text-blue-600"
                bg="bg-blue-50"
            />
            <MetricCard
                title="Total Impressions"
                value={<RollingCounter value={metrics.totalImpressions} />}
                icon={Users}
                color="text-purple-600"
                bg="bg-purple-50"
            />
            <MetricCard
                title="Total Clicks"
                value={<RollingCounter value={metrics.totalClicks} />}
                icon={MousePointerClick}
                color="text-orange-600"
                bg="bg-orange-50"
            />
            <MetricCard
                title="Pending Approvals"
                value={metrics.pendingApprovals}
                icon={Archive}
                color="text-yellow-600"
                bg="bg-yellow-50"
                onClick={() => setActiveTab('pending')}
                clickable={true}
            />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
            <button
                onClick={() => setActiveTab('campaigns')}
                className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'campaigns'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Campaigns
            </button>
            <button
                onClick={() => setActiveTab('pending')}
                className={`pb-3 px-4 font-semibold transition-colors relative ${activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Pending Approvals
                {metrics.pendingApprovals > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {metrics.pendingApprovals}
                    </span>
                )}
            </button>
            <button
                onClick={() => setActiveTab('credits')}
                className={`pb-3 px-4 font-semibold transition-colors relative ${activeTab === 'credits'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Requests
                {metrics.pendingCredits > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {metrics.pendingCredits}
                    </span>
                )}
            </button>
        </div>

        {activeTab === 'campaigns' && <CampaignsTable campaigns={campaigns} navigate={navigate} />}
        {activeTab === 'pending' && <PendingAdsTable ads={pendingAds} onApprove={handleApprove} onReject={handleReject} />}
        {activeTab === 'credits' && <CreditRequestsTable requests={creditRequests} onApprove={handleApproveCredit} onReject={handleRejectCredit} />}
    </div>
)
}

function CreditRequestsTable({ requests, onApprove, onReject }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Pending Credit Requests</h2>
            </div>
            {requests.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <p>No pending credit requests.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Advertiser</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">@{req.advertiser?.username}</div>
                                        <div className="text-xs text-gray-500">{req.advertiser?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-600">
                                        ₹{req.amount}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onApprove(req.id)}
                                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => onReject(req.id)}
                                                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function CampaignsTable({ campaigns, navigate }) { // Accept navigate
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">Recent Campaigns</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Campaign</th>
                            <th className="px-6 py-3">Advertiser</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Pending</th>
                            <th className="px-6 py-3">Impressions</th>
                            <th className="px-6 py-3">Clicks</th>
                            <th className="px-6 py-3">Est. Rev</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map(camp => (
                            <tr
                                key={camp.id}
                                onClick={() => navigate(`/admin/ads/${camp.id}`)}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{camp.name}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{camp.description}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    @{(() => {
                                        const p = camp.advertiser
                                        if (Array.isArray(p)) return p[0]?.username || 'Unknown'
                                        return p?.username || 'Unknown'
                                    })()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-green-100 text-green-700' :
                                        camp.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {camp.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {camp.stats.pendingAds > 0 ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            {camp.stats.pendingAds} pending
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {camp.stats.impressions.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {camp.stats.clicks.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-green-600">
                                    ₹{camp.stats.estRevenue.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {campaigns.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    No campaigns found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function PendingAdsTable({ ads, onApprove, onReject }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Pending Ad Approvals</h2>
            </div>

            {ads.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No pending ads to review!</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {ads.map(ad => (
                        <div key={ad.id} className="p-6">
                            <div className="flex gap-6">
                                {/* Ad Preview */}
                                <div className="w-48 h-32 flex-shrink-0">
                                    {ad.image_url ? (
                                        <img
                                            src={ad.image_url}
                                            alt={ad.title}
                                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Eye size={32} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Ad Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 mb-1">{ad.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Campaign: {ad.campaign?.name}</span>
                                        <span>•</span>
                                        <span>By: @{(() => {
                                            const p = ad.campaign?.profiles
                                            // Handle if it's an array or object
                                            if (Array.isArray(p)) return p[0]?.username || 'Unknown'
                                            return p?.username || 'Unknown'
                                        })()}</span>
                                        <span>•</span>
                                        <span>Target: {ad.target_url}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => onApprove(ad.id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onReject(ad.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function MetricCard({ title, value, icon: Icon, color, bg, onClick, clickable }) {
    const baseClasses = "bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
    const classes = clickable ? `${baseClasses} cursor-pointer hover:shadow-md transition-all` : baseClasses

    return (
        <div className={classes} onClick={onClick}>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    )
}
