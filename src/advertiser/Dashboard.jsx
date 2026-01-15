import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import {
    BarChart3, TrendingUp, DollarSign, Eye, MousePointerClick,
    Plus, Settings as SettingsIcon, Pause, Play, Trash2, Edit2, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdvertiserDashboard({ session }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])
    const [editingCampaign, setEditingCampaign] = useState(null)
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0
    })

    useEffect(() => {
        checkAdvertiserAccess()
        fetchCampaigns()
    }, [])

    const checkAdvertiserAccess = async () => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'advertiser') {
            toast.error('Advertiser access required')
            navigate('/')
        }
    }

    const fetchCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('ad_campaigns')
                .select(`
                    *,
                    advertisements (
                        id,
                        impressions,
                        clicks,
                        status
                    )
                `)
                .eq('advertiser_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            setCampaigns(data || [])
            calculateStats(data || [])
        } catch (error) {
            console.error('Error fetching campaigns:', error)
            toast.error('Failed to load campaigns')
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (campaigns) => {
        const stats = campaigns.reduce((acc, campaign) => {
            acc.totalCampaigns++
            if (campaign.status === 'active') acc.activeCampaigns++
            acc.totalSpent += parseFloat(campaign.spent || 0)

            campaign.advertisements?.forEach(ad => {
                acc.totalImpressions += ad.impressions || 0
                acc.totalClicks += ad.clicks || 0
            })

            return acc
        }, {
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalSpent: 0,
            totalImpressions: 0,
            totalClicks: 0
        })

        setStats(stats)
    }

    const handlePauseCampaign = async (campaignId) => {
        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update({ status: 'paused' })
                .eq('id', campaignId)

            if (error) throw error

            toast.success('Campaign paused')
            fetchCampaigns()
        } catch (error) {
            toast.error('Failed to pause campaign')
        }
    }

    const handleActivateCampaign = async (campaign) => {
        if ((campaign.spent || 0) >= campaign.budget) {
            return toast.error('Budget exhausted! Increase budget to resume.')
        }

        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update({ status: 'active' })
                .eq('id', campaign.id)

            if (error) throw error

            toast.success('Campaign activated')
            fetchCampaigns()
        } catch (error) {
            toast.error('Failed to activate campaign')
        }
    }

    const handleDeleteCampaign = async (campaignId) => {
        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return

        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .delete()
                .eq('id', campaignId)

            if (error) throw error

            toast.success('Campaign deleted')
            fetchCampaigns()
        } catch (error) {
            toast.error('Failed to delete campaign')
        }
    }

    const handleEditCampaign = async (campaignId, updates) => {
        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update(updates)
                .eq('id', campaignId)

            if (error) throw error

            toast.success('Campaign updated')
            setEditingCampaign(null)
            fetchCampaigns()
        } catch (error) {
            toast.error('Failed to update campaign')
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Advertiser Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage your campaigns and track performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchCampaigns}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} />
                        Refresh
                    </button>
                    <button
                        onClick={() => navigate('/advertiser/create-campaign')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Create Campaign
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Total Campaigns */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Campaigns</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCampaigns}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Active Campaigns */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats.activeCampaigns}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Impressions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Impressions</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalImpressions.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Eye className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Clicks */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Clicks</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.totalClicks.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MousePointerClick className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
                </div>

                {campaigns.length === 0 ? (
                    <div className="p-12 text-center">
                        <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                        <p className="text-gray-500 mb-4">Create your first campaign to start advertising</p>
                        <button
                            onClick={() => navigate('/advertiser/create-campaign')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            Create Campaign
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {campaigns.map(campaign => {
                            const isEditing = editingCampaign === campaign.id
                            const totalImpressions = campaign.advertisements?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0
                            const totalClicks = campaign.advertisements?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0
                            const activeAds = campaign.advertisements?.filter(ad => ad.status === 'active').length || 0

                            return (
                                <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {campaign.status.toUpperCase()}
                                                </span>
                                            </div>
                                            {campaign.description && (
                                                <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                                            )}
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Budget:</span>
                                                    <span className="ml-2 font-semibold">₹{campaign.budget}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Spent:</span>
                                                    <span className="ml-2 font-semibold text-orange-600">₹{campaign.spent}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Ads:</span>
                                                    <span className="ml-2 font-semibold">{campaign.advertisements?.length || 0} ({activeAds} active)</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Impressions:</span>
                                                    <span className="ml-2 font-semibold text-purple-600">{totalImpressions.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Clicks:</span>
                                                    <span className="ml-2 font-semibold text-blue-600">{totalClicks.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Budget Progress Bar */}
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-1">
                                                    <span>Budget Usage</span>
                                                    <span className={campaign.budget - (campaign.spent || 0) < 100 ? "text-red-600" : "text-green-600"}>
                                                        {Math.max(0, campaign.budget - (campaign.spent || 0))} credits remaining
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${(campaign.spent || 0) / campaign.budget > 0.9 ? 'bg-red-500' :
                                                            (campaign.spent || 0) / campaign.budget > 0.7 ? 'bg-yellow-500' : 'bg-blue-600'
                                                            }`}
                                                        style={{ width: `${Math.min(100, ((campaign.spent || 0) / campaign.budget) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            {campaign.status === 'active' ? (
                                                <button
                                                    onClick={() => handlePauseCampaign(campaign.id)}
                                                    className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                                                    title="Pause Campaign"
                                                >
                                                    <Pause size={20} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivateCampaign(campaign)}
                                                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Activate Campaign"
                                                >
                                                    <Play size={20} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/advertiser/campaign/${campaign.id}`)}
                                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Manage Ads"
                                            >
                                                <SettingsIcon size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Campaign"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
