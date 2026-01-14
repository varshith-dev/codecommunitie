import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import {
    BarChart3, TrendingUp, DollarSign, Eye, MousePointerClick,
    Plus, Settings as SettingsIcon, Pause, Play, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdvertiserDashboard({ session }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])
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
            .select('is_advertiser')
            .eq('id', session.user.id)
            .single()

        if (!profile?.is_advertiser) {
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
                        clicks
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
                <button
                    onClick={() => navigate('/advertiser/create-campaign')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Create Campaign
                </button>
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
                <div className="px-6 py-4 border-b border-gray-200">
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
                        {campaigns.map(campaign => (
                            <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                        {campaign.description && (
                                            <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                                        )}
                                        <div className="flex gap-6 text-sm">
                                            <div>
                                                <span className="text-gray-500">Budget:</span>
                                                <span className="ml-2 font-semibold">${campaign.budget}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Spent:</span>
                                                <span className="ml-2 font-semibold">${campaign.spent}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Ads:</span>
                                                <span className="ml-2 font-semibold">{campaign.advertisements?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/advertiser/campaign/${campaign.id}`)}
                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                                            title="View Details"
                                        >
                                            <SettingsIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
