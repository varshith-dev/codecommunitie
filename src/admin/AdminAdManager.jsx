import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
    LayoutDashboard, DollarSign, Users, MousePointerClick,
    TrendingUp, Activity, Archive, PauseCircle, PlayCircle, Loader, CheckCircle, XCircle, Eye, CreditCard, Settings
} from 'lucide-react'
import toast from 'react-hot-toast'
import RollingCounter from '../components/RollingCounter'
import { useNavigate } from 'react-router-dom'
import { EmailService } from '../services/EmailService'
import { EmailTemplates, wrapInTemplate } from '../services/EmailTemplates'
import { InvoiceGenerator } from '../utils/InvoiceGenerator'

export default function AdminAdManager() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])
    const [pendingAds, setPendingAds] = useState([])
    const [creditRequests, setCreditRequests] = useState([])
    const [activeTab, setActiveTab] = useState('campaigns') // 'campaigns', 'pending', 'credits', 'advertisers'
    const [advertisers, setAdvertisers] = useState([])
    const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false)
    const [selectedAdvertiser, setSelectedAdvertiser] = useState(null)
    const [creditAmount, setCreditAmount] = useState('')
    const [adSettings, setAdSettings] = useState({ cpc_rate: 5.0, cpm_rate: 2.0 })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [settingsLoading, setSettingsLoading] = useState(false)
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
            console.log('Fetching Ad Data...')

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

            // 4. Fetch All Advertisers (profiles with role 'advertiser' or have campaigns)
            // For now fetching all profiles, or we could filter. Let's fetch profiles with role 'advertiser'
            // If role column doesn't exist or isn't reliable, allow fetching all.
            // Assuming 'role' exists based on previous code.
            const { data: advertiserData, error: advertiserError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'advertiser')
                .order('created_at', { ascending: false })

            if (advertiserError) console.error('Error fetching advertisers:', advertiserError)
            // Filter locally or via query if 'role' column acts as discriminator
            const advs = advertiserData || []
            setAdvertisers(advs)

            // 5. Fetch Ad Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('ad_settings')
                .select('*')
                .single()

            if (settingsData) setAdSettings(settingsData)

            // 6. Calculate Real Revenue (Sum of approved credit requests)
            const { data: approvedCredits, error: revError } = await supabase
                .from('ad_credit_requests')
                .select('amount')
                .eq('status', 'approved')

            // Also should theoretically include manually added credits if we tracked them separately as transactions. 
            // For now, let's rely on approved requests as the "Revenue".
            const realRevenue = approvedCredits?.reduce((sum, item) => sum + item.amount, 0) || 0

            // 7. Process Campaign Data
            let impressions = 0
            let clicks = 0
            let active = 0
            let pending = 0

            const processedCampaigns = rawCampaigns.map(camp => {
                const campImpressions = camp.ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)
                const campClicks = camp.ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)
                const pendingCount = camp.ads.filter(ad => ad.approval_status === 'pending').length

                // Removed Mock Revenue Calculation

                impressions += campImpressions
                clicks += campClicks
                pending += pendingCount
                if (camp.status === 'active') active++

                return {
                    ...camp,
                    stats: {
                        impressions: campImpressions,
                        clicks: campClicks,
                        estRevenue: 0, // Deprecated at campaign level for now or calc based on hits
                        pendingAds: pendingCount
                    }
                }
            })

            setCampaigns(processedCampaigns)
            setMetrics({
                totalRevenue: realRevenue,
                activeCampaigns: active,
                totalImpressions: impressions,
                totalClicks: clicks,
                pendingApprovals: pending,
                pendingCredits: creditData?.length || 0
            })
            console.log('Ad Data Fetched:', { processedCampaigns, metrics })

        } catch (error) {
            console.error('Error fetching ad data:', error)
            toast.error('Failed to load ad data')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (adId) => {
        try {
            // Fetch ad details first for email
            const { data: adData, error: fetchError } = await supabase
                .from('advertisements')
                .select(`
                    *,
                    campaign:ad_campaigns(profiles(username, display_name, email))
                `)
                .eq('id', adId)
                .single()

            if (fetchError) throw fetchError

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

            // Send Email
            if (adData?.campaign?.profiles?.email) {
                const user = adData.campaign.profiles
                const template = EmailTemplates.AD_APPROVED
                await EmailService.send({
                    recipientEmail: user.email,
                    memberName: user.display_name || user.username,
                    subject: template.subject(),
                    htmlContent: wrapInTemplate(template.body(user.display_name || user.username, adData.title), template.title),
                    templateType: 'AD_APPROVED',
                    triggeredBy: 'admin'
                }).catch(err => console.error('Failed to send email:', err))
            }

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
            // Fetch request details for email
            const { data: reqData } = await supabase
                .from('ad_credit_requests')
                .select(`*, advertiser:profiles(username, display_name, email)`)
                .eq('id', requestId)
                .single()

            const { error } = await supabase.rpc('approve_ad_credit_request', { request_id: requestId })
            if (error) throw error
            toast.success('Credits approved & added to wallet')

            // Send Email with Invoice
            if (reqData?.advertiser?.email) {
                const user = reqData.advertiser
                const template = EmailTemplates.CREDITS_APPROVED

                // Generate Invoice
                const invoiceDataURI = InvoiceGenerator.getDataURI(
                    { id: requestId, amount: reqData.amount, date: reqData.created_at, description: 'Ad Credits Replenishment' },
                    { name: user.display_name || user.username, email: user.email }
                )

                await EmailService.send({
                    recipientEmail: user.email,
                    memberName: user.display_name || user.username,
                    subject: template.subject(),
                    htmlContent: wrapInTemplate(template.body(user.display_name || user.username, reqData.amount), template.title),
                    templateType: 'CREDITS_APPROVED',
                    triggeredBy: 'admin',
                    attachments: [
                        {
                            filename: `BS_Invoice_${requestId.slice(0, 8)}.pdf`,
                            path: invoiceDataURI
                        }
                    ]
                }).catch(err => console.error('Failed to send email:', err))
            }

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
    }

    const handleAddManualCredits = async (e) => {
        e.preventDefault()
        if (!selectedAdvertiser || !creditAmount) return

        try {
            const { error } = await supabase.rpc('admin_add_credits', {
                target_user_id: selectedAdvertiser.id,
                amount: parseFloat(creditAmount)
            })

            if (error) throw error

            toast.success(`Successfully added ₹${creditAmount} to ${selectedAdvertiser.username}`)

            // Send Email
            if (selectedAdvertiser.email) {
                const template = EmailTemplates.CREDITS_APPROVED
                await EmailService.send({
                    recipientEmail: selectedAdvertiser.email,
                    memberName: selectedAdvertiser.display_name || selectedAdvertiser.username,
                    subject: template.subject(),
                    htmlContent: wrapInTemplate(template.body(selectedAdvertiser.display_name || selectedAdvertiser.username, creditAmount), template.title),
                    templateType: 'CREDITS_APPROVED',
                    triggeredBy: 'admin'
                }).catch(err => console.error('Failed to send email:', err))
            }

            setIsAddCreditModalOpen(false)
            setCreditAmount('')
            setSelectedAdvertiser(null)
            fetchAdData() // Refresh data
        } catch (error) {
            console.error('Error adding credits:', error)
            toast.error('Failed to add credits: ' + error.message)
        }
    }

    const handleUpdateSettings = async (e) => {
        e.preventDefault()
        setSettingsLoading(true)
        try {
            const { error } = await supabase
                .from('ad_settings')
                .update({
                    cpc_rate: parseFloat(adSettings.cpc_rate),
                    cpm_rate: parseFloat(adSettings.cpm_rate),
                    updated_at: new Date().toISOString()
                })
                .eq('id', adSettings.id || 1) // Assuming ID 1 or getting from fetch

            if (error) throw error
            toast.success('Ad rates updated successfully!')
            setIsSettingsOpen(false)
        } catch (error) {
            console.error('Error updating settings:', error)
            toast.error('Failed to update settings')
        } finally {
            setSettingsLoading(false)
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
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Ad Manager & Revenue
                    </h1>
                    <p className="text-gray-500">Monitor advertising campaigns and approve pending ads.</p>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Settings size={18} />
                    Ad Settings
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`₹${metrics.totalRevenue.toLocaleString()}`}
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
                <button
                    onClick={() => setActiveTab('advertisers')}
                    className={`pb-3 px-4 font-semibold transition-colors ${activeTab === 'advertisers'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Advertisers
                </button>
            </div>

            {activeTab === 'campaigns' && <CampaignsTable campaigns={campaigns} navigate={navigate} />}
            {activeTab === 'pending' && <PendingAdsTable ads={pendingAds} onApprove={handleApprove} onReject={handleReject} />}
            {activeTab === 'credits' && <CreditRequestsTable requests={creditRequests} onApprove={handleApproveCredit} onReject={handleRejectCredit} />}
            {activeTab === 'advertisers' && (
                <AdvertisersTable
                    advertisers={advertisers}
                    onAddCredits={(user) => {
                        setSelectedAdvertiser(user)
                        setIsAddCreditModalOpen(true)
                    }}
                />
            )}

            {/* Add Credit Modal */}
            {isAddCreditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 animate-scale-in">
                        <h2 className="text-xl font-bold mb-4">Add Credits Manually</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser</label>
                            <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-900 font-medium">
                                @{selectedAdvertiser?.username}
                            </div>
                        </div>
                        <form onSubmit={handleAddManualCredits}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={creditAmount}
                                    onChange={e => setCreditAmount(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCreditModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Add Credits
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 animate-scale-in">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Settings size={20} /> Ad Platform Settings
                        </h2>
                        <form onSubmit={handleUpdateSettings}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cost Per Click (CPC) Rate
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={adSettings.cpc_rate}
                                            onChange={e => setAdSettings({ ...adSettings, cpc_rate: e.target.value })}
                                            className="w-full border rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Cost deducted per ad click.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CPM Rate (Per 1k Impressions)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={adSettings.cpm_rate}
                                            onChange={e => setAdSettings({ ...adSettings, cpm_rate: e.target.value })}
                                            className="w-full border rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Cost deducted per 1,000 views.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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


function AdvertisersTable({ advertisers, onAddCredits }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">All Advertisers</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {advertisers.length} Users
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Wallet Balance</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {advertisers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">@{user.username || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        user.role === 'advertiser' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {(user.role || 'User').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">₹{user.ad_credits || 0}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onAddCredits(user)}
                                        className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                                    >
                                        <CreditCard size={14} />
                                        Add Funds
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
