import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
    ArrowLeft, Eye, MousePointerClick, CheckCircle, XCircle, Clock, ExternalLink, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import RollingCounter from '../components/RollingCounter'

export default function AdminCampaignDetails() {
    const { campaignId } = useParams()
    const navigate = useNavigate()
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)
    const [ads, setAds] = useState([])

    useEffect(() => {
        fetchDetails()

        // Realtime subscription for ads updates
        const subscription = supabase
            .channel(`admin-campaign-${campaignId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'advertisements',
                filter: `campaign_id=eq.${campaignId}`
            }, () => {
                fetchDetails()
            })
            .subscribe()

        return () => supabase.removeChannel(subscription)
    }, [campaignId])

    const fetchDetails = async () => {
        try {
            // Fetch campaign + advertiser profile
            const { data: campData, error: campError } = await supabase
                .from('ad_campaigns')
                .select(`
                    *,
                    advertiser:profiles(username, display_name, avatar_url)
                `)
                .eq('id', campaignId)
                .single()

            if (campError) throw campError
            setCampaign(campData)

            // Fetch ads
            const { data: adsData, error: adsError } = await supabase
                .from('advertisements')
                .select('*')
                .eq('campaign_id', campaignId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })

            if (adsError) throw adsError
            setAds(adsData)

        } catch (error) {
            console.error('Error fetching campaign details:', error)
            toast.error('Failed to load campaign')
            navigate('/admin/ads')
        } finally {
            setLoading(false)
        }
    }

    const handleApproveAd = async (adId) => {
        try {
            const { error } = await supabase
                .from('advertisements')
                .update({ approval_status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', adId)

            if (error) throw error
            toast.success('Ad approved')
        } catch (error) {
            toast.error('Failed to approve ad')
        }
    }

    const handleRejectAd = async (adId) => {
        const reason = prompt('Reason for rejection:')
        if (reason === null) return // Cancelled

        try {
            const { error } = await supabase
                .from('advertisements')
                .update({ approval_status: 'rejected', rejection_reason: reason })
                .eq('id', adId)

            if (error) throw error
            toast.success('Ad rejected')
        } catch (error) {
            toast.error('Failed to reject ad')
        }
    }

    if (loading) return <div className="p-10 text-center">Loading...</div>
    if (!campaign) return null

    // Calculate aggregated stats
    const totalImpressions = ads.reduce((acc, ad) => acc + (ad.impressions || 0), 0)
    const totalClicks = ads.reduce((acc, ad) => acc + (ad.clicks || 0), 0)

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <button
                onClick={() => navigate('/admin/ads')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                Back to Ad Manager
            </button>

            {/* Campaign Overview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {campaign.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-600 mb-4">{campaign.description}</p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg inline-block">
                            <span>Advertiser:</span>
                            <span className="font-semibold text-gray-900">@{campaign.advertiser?.username}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-right">
                        <div>
                            <p className="text-gray-500 text-sm">Impressions</p>
                            <p className="text-2xl font-bold text-purple-600">
                                <RollingCounter value={totalImpressions} />
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Clicks</p>
                            <p className="text-2xl font-bold text-orange-600">
                                <RollingCounter value={totalClicks} />
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Budget</p>
                            <p className="text-xl font-semibold">₹{campaign.budget}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Spent</p>
                            <p className="text-xl font-semibold text-gray-900">₹{campaign.spent}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ads List */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Ads ({ads.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 relative group">
                            {ad.image_url ? (
                                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Activity size={32} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${ad.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                        ad.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {ad.approval_status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1">{ad.title}</h3>
                            <p className="text-sm text-gray-500 mb-3 truncate">{ad.description}</p>

                            <div className="flex gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg justify-around">
                                <div className="flex items-center gap-1">
                                    <Eye size={16} className="text-purple-500" />
                                    <span>{ad.impressions}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MousePointerClick size={16} className="text-orange-500" />
                                    <span>{ad.clicks}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {ad.approval_status !== 'approved' && (
                                    <button
                                        onClick={() => handleApproveAd(ad.id)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                )}
                                {ad.approval_status !== 'rejected' && (
                                    <button
                                        onClick={() => handleRejectAd(ad.id)}
                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
