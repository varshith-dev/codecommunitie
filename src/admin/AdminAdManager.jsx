import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
    LayoutDashboard, DollarSign, Users, MousePointerClick,
    TrendingUp, Activity, Archive, PauseCircle, PlayCircle, Loader
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAdManager() {
    const [loading, setLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeCampaigns: 0,
        totalImpressions: 0,
        totalClicks: 0
    })

    useEffect(() => {
        fetchAdData()
    }, [])

    const fetchAdData = async () => {
        try {
            setLoading(true)

            // 1. Fetch Campaigns with Advertiser Info
            const { data: rawCampaigns, error } = await supabase
                .from('ad_campaigns')
                .select(`
                    *,
                    advertiser:profiles(username, display_name),
                    ads:advertisements(id, impressions, clicks, status)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            // 2. Process Data
            let revenue = 0
            let impressions = 0
            let clicks = 0
            let active = 0

            const processedCampaigns = rawCampaigns.map(camp => {
                const campImpressions = camp.ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)
                const campClicks = camp.ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)

                // Mock Revenue Calculation (e.g. $5 per 1000 impressions + $0.50 per click)
                // In a real app, this would come from a transactions table
                const estRevenue = (campImpressions / 1000 * 5) + (campClicks * 0.50)

                revenue += estRevenue
                impressions += campImpressions
                clicks += campClicks
                if (camp.status === 'active') active++

                return {
                    ...camp,
                    stats: {
                        impressions: campImpressions,
                        clicks: campClicks,
                        estRevenue
                    }
                }
            })

            setCampaigns(processedCampaigns)
            setMetrics({
                totalRevenue: revenue,
                activeCampaigns: active,
                totalImpressions: impressions,
                totalClicks: clicks
            })

        } catch (error) {
            console.error('Error fetching ad data:', error)
            toast.error('Failed to load ad data')
        } finally {
            setLoading(false)
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
                <p className="text-gray-500">Monitor advertising campaigns and platform revenue.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    value={metrics.totalImpressions.toLocaleString()}
                    icon={Users}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <MetricCard
                    title="Total Clicks"
                    value={metrics.totalClicks.toLocaleString()}
                    icon={MousePointerClick}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
            </div>

            {/* Recent Campaigns Table */}
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
                                <th className="px-6 py-3">Impressions</th>
                                <th className="px-6 py-3">Clicks</th>
                                <th className="px-6 py-3">Est. Rev</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {campaigns.map(camp => (
                                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{camp.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{camp.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        @{camp.advertiser?.username || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-green-100 text-green-700' :
                                            camp.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {camp.status.toUpperCase()}
                                        </span>
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
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No campaigns found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
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
