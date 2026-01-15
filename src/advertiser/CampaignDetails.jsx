import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
    ArrowLeft, Plus, Image as ImageIcon, Link as LinkIcon,
    Type, MousePointerClick, Eye, Trash2, ExternalLink, Edit2, X, Clock, CheckCircle, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CampaignDetails({ session }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [campaign, setCampaign] = useState(null)
    const [ads, setAds] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState(false)
    const [editingAd, setEditingAd] = useState(null)
    const [previewAd, setPreviewAd] = useState(null)
    const [campaignEdit, setCampaignEdit] = useState({})

    // New Ad Form State
    const [newAd, setNewAd] = useState({
        title: '',
        description: '',
        image_url: '',
        target_url: '',
        cta_text: 'Learn More',
        placement: 'feed',
        tags: []
    })
    const [creatingAd, setCreatingAd] = useState(false)
    const [tagInput, setTagInput] = useState('')

    // ... (rest of imports and setup)

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            const tag = tagInput.trim().replace(/^#+/, '')
            if (!newAd.tags.includes(tag)) {
                setNewAd(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }))
            }
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setNewAd(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }))
    }

    // For editing
    const [editTagInput, setEditTagInput] = useState('')
    const handleAddEditTag = (e) => {
        if (e.key === 'Enter' && editTagInput.trim()) {
            e.preventDefault()
            const tag = editTagInput.trim().replace(/^#+/, '')
            const currentTags = editingAd.tags || []
            if (!currentTags.includes(tag)) {
                setEditingAd({ ...editingAd, tags: [...currentTags, tag] })
            }
            setEditTagInput('')
        }
    }
    const removeEditTag = (tagToRemove) => {
        setEditingAd({
            ...editingAd,
            tags: (editingAd.tags || []).filter(t => t !== tagToRemove)
        })
    }


    // ... inside render ...

    // INSIDE CREATE FORM (add before CTA Button)
    /*
        <div>
            <label className="block text-sm font-medium mb-1">Target Interest Tags (Hit Enter)</label>
            <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg min-h-[42px]">
                {newAd.tags?.map(tag => (
                   <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                       #{tag}
                       <button type="button" onClick={() => removeTag(tag)}><X size={12}/></button>
                   </span> 
                ))}
                <input 
                    type="text" 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="flex-1 outline-none text-sm min-w-[100px]"
                    placeholder="Type tag & enter..."
                />
            </div>
        </div>
    */

    // INSIDE EDIT FORM (add before buttons)
    /*
       <div>
           <label className="block text-sm font-medium mb-1">Target Interest Tags</label>
           <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg min-h-[42px]">
               {editingAd.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      #{tag}
                      <button type="button" onClick={() => removeEditTag(tag)}><X size={12}/></button>
                  </span> 
               ))}
               <input 
                   type="text" 
                   value={editTagInput}
                   onChange={e => setEditTagInput(e.target.value)}
                   onKeyDown={handleAddEditTag}
                   className="flex-1 outline-none text-sm min-w-[100px]"
                   placeholder="Type tag & enter..."
               />
           </div>
       </div>
   */

    // INSIDE AD CARD (display tags)
    /*
        <div className="flex flex-wrap gap-1 mt-2">
            {ad.tags?.map(tag => (
                <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
        </div>
    */

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
                .select('*, approval_status, approved_at, rejection_reason')
                .eq('campaign_id', id)
                .is('deleted_at', null)
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

    // Auto-refresh when tab becomes visible (user switches back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && id) {
                fetchCampaignDetails()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [id])

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
        if (!confirm('Are you sure you want to delete this ad? This will archive it and preserve metrics.')) return

        try {
            const { error } = await supabase
                .from('advertisements')
                .update({ deleted_at: new Date().toISOString(), status: 'archived' })
                .eq('id', adId)

            if (error) throw error

            toast.success('Ad archived')
            setAds(ads.filter(a => a.id !== adId))
        } catch (error) {
            console.error('Error archiving ad:', error)
            toast.error('Error archiving ad')
        }
    }

    const handleEditCampaign = async () => {
        try {
            const { error } = await supabase
                .from('ad_campaigns')
                .update({
                    name: campaignEdit.name || campaign.name,
                    description: campaignEdit.description || campaign.description,
                    budget: campaignEdit.budget || campaign.budget
                })
                .eq('id', id)

            if (error) throw error

            toast.success('Campaign updated!')
            setCampaign({ ...campaign, ...campaignEdit })
            setEditingCampaign(false)
            setCampaignEdit({})
        } catch (error) {
            toast.error('Failed to update campaign')
        }
    }

    const handleEditAd = async (adData) => {
        try {
            const { error } = await supabase
                .from('advertisements')
                .update(adData)
                .eq('id', editingAd.id)

            if (error) throw error

            toast.success('Ad updated!')
            setAds(ads.map(a => a.id === editingAd.id ? { ...a, ...adData } : a))
            setEditingAd(null)
        } catch (error) {
            toast.error('Failed to update ad')
        }
    }

    const getApprovalBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Pending Approval' },
            approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Rejected' }
        }
        const badge = badges[status] || badges.pending
        const Icon = badge.icon
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color} flex items-center gap-1`}>
                <Icon size={14} />
                {badge.text}
            </span>
        )
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setEditingCampaign(true); setCampaignEdit(campaign); }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Edit2 size={16} />
                            Edit Campaign
                        </button>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Budget</p>
                            <p className="text-2xl font-bold text-gray-900">₹{campaign.budget}</p>
                            <p className="text-sm text-gray-500 mt-1">Spent: ₹{campaign.spent}</p>
                        </div>
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

                            {/* Tags display */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {ad.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{tag.replace(/^#+/, '')}</span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded w-full truncate">
                                    {ad.target_url}
                                </span>
                                <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="flex justify-between items-center gap-2 border-t pt-3 mt-2">
                                {getApprovalBadge(ad.approval_status || 'pending')}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPreviewAd(ad)}
                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Preview">
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => setEditingAd(ad)}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAd(ad.id)}
                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div >

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

                            <div>
                                <label className="block text-sm font-medium mb-1">Target Interest Tags (Hit Enter)</label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg min-h-[42px]">
                                    {newAd.tags?.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        className="flex-1 outline-none text-sm min-w-[100px]"
                                        placeholder="Type tag & enter..."
                                    />
                                </div>
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

            {/* Edit Campaign Modal */}
            {editingCampaign && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit Campaign</h2>
                            <button onClick={() => setEditingCampaign(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                                <input
                                    type="text"
                                    value={campaignEdit.name || ''}
                                    onChange={e => setCampaignEdit({ ...campaignEdit, name: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={campaignEdit.description || ''}
                                    onChange={e => setCampaignEdit({ ...campaignEdit, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Total Budget</label>
                                <input
                                    type="number"
                                    value={campaignEdit.budget || ''}
                                    onChange={e => setCampaignEdit({ ...campaignEdit, budget: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button
                                    onClick={() => setEditingCampaign(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditCampaign}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Ad Modal */}
            {editingAd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit Advertisement</h2>
                            <button onClick={() => setEditingAd(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Headline</label>
                                <input
                                    type="text"
                                    value={editingAd.title || ''}
                                    onChange={e => setEditingAd({ ...editingAd, title: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={editingAd.description || ''}
                                    onChange={e => setEditingAd({ ...editingAd, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows="2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={editingAd.image_url || ''}
                                    onChange={e => setEditingAd({ ...editingAd, image_url: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Target URL</label>
                                <input
                                    type="url"
                                    value={editingAd.target_url || ''}
                                    onChange={e => setEditingAd({ ...editingAd, target_url: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="flex gap-3 mt-6 pt-4 border-t">
                                <button
                                    onClick={() => setEditingAd(null)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleEditAd(editingAd)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Update Ad
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Ad Modal */}
            {previewAd && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewAd(null)}>
                    <div className="bg-transparent max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end mb-2">
                            <button onClick={() => setPreviewAd(null)} className="text-white hover:text-gray-200 bg-white/10 rounded-full p-1">
                                <X size={20} />
                            </button>
                        </div>
                        {/* Render Ad Card-like preview */}
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    Ad
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Sponsored</h3>
                                    <p className="text-xs text-gray-500">{campaign.name}</p>
                                </div>
                            </div>

                            <div className="relative">
                                {previewAd.image_url ? (
                                    <img src={previewAd.image_url} alt={previewAd.title} className="w-full h-auto object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h2 className="font-bold text-lg mb-1">{previewAd.title}</h2>
                                <p className="text-sm text-gray-600 mb-4">{previewAd.description}</p>

                                <a
                                    href={previewAd.target_url}
                                    target="_blank"
                                    className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    {previewAd.cta_text || 'Learn More'}
                                </a>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-500 border-t border-gray-100">
                                Preview Mode • Links are disabled
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
