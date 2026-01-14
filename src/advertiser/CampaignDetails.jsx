import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
    ArrowLeft, Plus, Image as ImageIcon, Link as LinkIcon,
    Type, MousePointerClick, Eye, Trash2, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CampaignDetails({ session }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [campaign, setCampaign] = useState(null)
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // New Ad Form State
    const [newAd, setNewAd] = useState({
        title: '',
        description: '',
        image_url: '',
        target_url: '',
        cta_text: 'Learn More',
        placement: 'feed'
    })
    const [creatingAd, setCreatingAd] = useState(false)

    useEffect(() => {
        fetchCampaignDetails()
    }, [id])

    const fetchCampaignDetails = async () => {
        try {
            // Fetch Campaign Info
            const { data: campaignData, error: campaignError } = await supabase
                .from('ad_campaigns')
                .select('*')
                .eq('id', id)
                .single()

            if (campaignError) throw campaignError
            setCampaign(campaignData)

            // Fetch Ads for this campaign
            const { data: adsData, error: adsError } = await supabase
                .from('advertisements')
                .select('*')
                .eq('campaign_id', id)
                .order('created_at', { ascending: false })

            if (adsError) throw adsError
            setAds(adsData || [])

        } catch (error) {
            console.error('Error fetching details:', error)
            toast.error('Failed to load campaign details')
            navigate('/advertiser/dashboard')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAd = async (e) => {
        e.preventDefault()
        if (!newAd.target_url) return toast.error('Target URL is required')

        setCreatingAd(true)
        try {
            const { data, error } = await supabase
                .from('advertisements')
                .insert([{
                    campaign_id: id,
                    ...newAd
                }])
                .select()
                .single()

            if (error) throw error

            toast.success('Ad created successfully!')
            setAds([data, ...ads])
            setShowCreateModal(false)
            setNewAd({
                title: '',
                description: '',
                image_url: '',
                target_url: '',
                cta_text: 'Learn More',
                placement: 'feed'
            })
        } catch (error) {
            toast.error('Failed to create ad: ' + error.message)
        } finally {
            setCreatingAd(false)
        }
    }

    const handleDeleteAd = async (adId) => {
        if (!confirm('Are you sure you want to delete this ad?')) return

        try {
            const { error } = await supabase
                .from('advertisements')
                .delete()
                .eq('id', adId)

            if (error) throw error

            toast.success('Ad deleted')
            setAds(ads.filter(a => a.id !== adId))
        } catch (error) {
            toast.error('Error deleting ad')
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!campaign) return null

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button
                onClick={() => navigate('/advertiser/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                Back to Dashboard
            </button>

            {/* Campaign Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                }`}>
                                {campaign.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-600 max-w-2xl">{campaign.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Budget</p>
                        <p className="text-2xl font-bold text-gray-900">${campaign.budget}</p>
                        <p className="text-sm text-gray-500 mt-1">Spent: ${campaign.spent}</p>
                    </div>
                </div>
            </div>

            {/* Ads Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Advertisements ({ads.length})</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Create Ad
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map(ad => (
                    <div key={ad.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Ad Preview (Visual) */}
                        <div className="aspect-video bg-gray-100 relative group">
                            {ad.image_url ? (
                                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <h3 className="text-white font-bold truncate">{ad.title}</h3>
                                <p className="text-white/80 text-xs truncate">{ad.description}</p>
                            </div>
                        </div>

                        {/* Ad Stats & Info */}
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Eye size={16} />
                                    <span>{ad.impressions}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MousePointerClick size={16} />
                                    <span>{ad.clicks}</span>
                                </div>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {ad.placement}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded w-full truncate">
                                    {ad.target_url}
                                </span>
                                <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="flex justify-between items-center border-t pt-3 mt-2">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {ad.status}
                                </span>
                                <button
                                    onClick={() => handleDeleteAd(ad.id)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {ads.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">No ads in this campaign yet</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Create your first ad
                    </button>
                </div>
            )}

            {/* Create Ad Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Create New Advertisement</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Headline *</label>
                                <input
                                    type="text"
                                    required
                                    value={newAd.title}
                                    onChange={e => setNewAd({ ...newAd, title: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="Catchy headline"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={newAd.description}
                                    onChange={e => setNewAd({ ...newAd, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows="2"
                                    placeholder="Ad copy text..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newAd.image_url}
                                        onChange={e => setNewAd({ ...newAd, image_url: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="https://..."
                                    />
                                    <button type="button" className="p-2 border rounded-lg hover:bg-gray-50" title="Upload Image (Mock)">
                                        <ImageIcon size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Target URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={newAd.target_url}
                                    onChange={e => setNewAd({ ...newAd, target_url: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="Where users will go..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">CTA Button</label>
                                    <select
                                        value={newAd.cta_text}
                                        onChange={e => setNewAd({ ...newAd, cta_text: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option>Learn More</option>
                                        <option>Shop Now</option>
                                        <option>Sign Up</option>
                                        <option>Get Offer</option>
                                        <option>Contact Us</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Placement</label>
                                    <select
                                        value={newAd.placement}
                                        onChange={e => setNewAd({ ...newAd, placement: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="feed">News Feed</option>
                                        <option value="sidebar">Sidebar</option>
                                        <option value="banner">Top Banner</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingAd}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creatingAd ? 'Creating...' : 'Launch Ad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function X({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 18 18" />
        </svg>
    )
}
